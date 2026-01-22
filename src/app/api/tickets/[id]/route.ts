import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, canAccessTicket, createAuditLog, adminDb } from '@/lib/firebase-admin';
import { checkRateLimit, RATE_LIMITS, createRateLimitKey, getRateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// Ticket update schema - all fields optional
const UpdateTicketSchema = z.object({
    status: z.enum(['open', 'assigned', 'in_progress', 'on_site', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    priorityScore: z.number().min(0).max(100).optional(),
    assignedTeam: z.string().max(100).optional(),
    assignedTeamId: z.string().max(100).optional(),
    assignedDepartment: z.string().max(100).optional(),
    internalNotes: z.array(z.object({
        id: z.string(),
        timestamp: z.union([z.string(), z.date()]),
        author: z.string().max(100),
        content: z.string().max(2000),
    })).optional(),
    aiAssessment: z.object({
        severity: z.string(),
        reason: z.string(),
        suggestedDepartment: z.string(),
        suggestedSkill: z.string(),
        estimatedTime: z.string(),
    }).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/tickets/[id] - Get a single ticket by ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // 1. Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 2. Fetch ticket
        const ticketRef = adminDb().collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticketData = ticketDoc.data();

        // 3. Check access permissions
        const access = canAccessTicket(decodedToken, {
            assignedDepartment: ticketData?.assignedDepartment,
            location: ticketData?.location,
        });

        if (!access.canRead) {
            return NextResponse.json({ error: 'Forbidden: No access to this ticket' }, { status: 403 });
        }

        // 4. Convert timestamps and return
        return NextResponse.json({
            ticket: {
                id: ticketDoc.id,
                ...ticketData,
                createdAt: ticketData?.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: ticketData?.updatedAt?.toDate?.()?.toISOString() || null,
                slaDeadline: ticketData?.slaDeadline?.toDate?.()?.toISOString() || null,
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Ticket GET Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }
}

/**
 * PATCH /api/tickets/[id] - Update a ticket
 */
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // 1. Rate limiting
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const rateLimit = checkRateLimit(
            createRateLimitKey(clientIp, undefined, 'ticket_update'),
            RATE_LIMITS.ticket_update
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: getRateLimitHeaders(rateLimit) }
            );
        }

        // 2. Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 3. Validate request body
        const body = await request.json();
        const validationResult = UpdateTicketSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // 4. Fetch existing ticket
        const ticketRef = adminDb().collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const existingData = ticketDoc.data()!;

        // 5. Check write permissions
        const access = canAccessTicket(decodedToken, {
            assignedDepartment: existingData.assignedDepartment,
            location: existingData.location,
        });

        if (!access.canWrite) {
            return NextResponse.json(
                { error: 'Forbidden: No write access to this ticket' },
                { status: 403 }
            );
        }

        // 6. Build update payload with activity log
        const now = Timestamp.now();
        const activityLogEntry = {
            id: crypto.randomUUID(),
            timestamp: now,
            action: buildActionDescription(validatedData, existingData),
            actor: decodedToken.email || 'Unknown',
            actorRole: decodedToken.role || 'unknown',
        };

        const updatePayload: Record<string, unknown> = {
            ...validatedData,
            updatedAt: now,
        };

        // Append to activity log instead of replacing
        if (existingData.activityLog) {
            updatePayload.activityLog = [...existingData.activityLog, activityLogEntry];
        }

        // Merge internal notes if provided
        if (validatedData.internalNotes) {
            // Convert timestamps in notes
            updatePayload.internalNotes = validatedData.internalNotes.map(note => ({
                ...note,
                timestamp: typeof note.timestamp === 'string'
                    ? Timestamp.fromDate(new Date(note.timestamp))
                    : Timestamp.fromDate(note.timestamp as Date),
            }));
        }

        // 7. Update ticket
        await ticketRef.update(updatePayload);

        // 8. Create audit log
        await createAuditLog({
            userId: decodedToken.uid,
            userName: decodedToken.email || 'Unknown',
            action: 'ticket_updated',
            targetType: 'ticket',
            targetId: id,
            oldValue: {
                status: existingData.status,
                assignedTeam: existingData.assignedTeam,
                priorityScore: existingData.priorityScore,
            },
            newValue: validatedData,
            ipAddress: clientIp,
        });

        // 9. Return updated ticket
        const updatedDoc = await ticketRef.get();
        const updatedData = updatedDoc.data();

        return NextResponse.json(
            {
                ticket: {
                    id: updatedDoc.id,
                    ...updatedData,
                    createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || null,
                    updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || null,
                    slaDeadline: updatedData?.slaDeadline?.toDate?.()?.toISOString() || null,
                }
            },
            { headers: getRateLimitHeaders(rateLimit) }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Ticket PATCH Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}

/**
 * DELETE /api/tickets/[id] - Delete a ticket (super_admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        // 1. Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 2. Only super_admin can delete
        if (decodedToken.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only super_admin can delete tickets' },
                { status: 403 }
            );
        }

        // 3. Check ticket exists
        const ticketRef = adminDb().collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticketData = ticketDoc.data();

        // 4. Delete ticket
        await ticketRef.delete();

        // 5. Create audit log
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        await createAuditLog({
            userId: decodedToken.uid,
            userName: decodedToken.email || 'Unknown',
            action: 'ticket_deleted',
            targetType: 'ticket',
            targetId: id,
            oldValue: { ticketNumber: ticketData?.ticketNumber, status: ticketData?.status },
            ipAddress: clientIp,
        });

        return NextResponse.json({ success: true, message: 'Ticket deleted' });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Ticket DELETE Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}

/**
 * Build a human-readable action description for the activity log
 */
function buildActionDescription(
    updates: z.infer<typeof UpdateTicketSchema>,
    existing: Record<string, unknown>
): string {
    const actions: string[] = [];

    if (updates.status && updates.status !== existing.status) {
        actions.push(`Status changed from ${existing.status} to ${updates.status}`);
    }

    if (updates.assignedTeam && updates.assignedTeam !== existing.assignedTeam) {
        actions.push(`Assigned to ${updates.assignedTeam}`);
    }

    if (updates.assignedDepartment && updates.assignedDepartment !== existing.assignedDepartment) {
        actions.push(`Department changed to ${updates.assignedDepartment}`);
    }

    if (updates.priorityScore !== undefined && updates.priorityScore !== existing.priorityScore) {
        actions.push(`Priority score updated to ${updates.priorityScore}`);
    }

    if (updates.aiAssessment) {
        actions.push('AI assessment applied');
    }

    if (updates.internalNotes &&
        Array.isArray(updates.internalNotes) &&
        Array.isArray(existing.internalNotes) &&
        updates.internalNotes.length > (existing.internalNotes as unknown[]).length) {
        actions.push('Internal note added');
    }

    return actions.length > 0 ? actions.join('; ') : 'Ticket updated';
}
