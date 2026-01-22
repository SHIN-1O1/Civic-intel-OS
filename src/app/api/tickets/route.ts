import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, hasPermission, createAuditLog, adminDb } from '@/lib/firebase-admin';
import { checkRateLimit, RATE_LIMITS, createRateLimitKey, getRateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// Ticket creation schema
const CreateTicketSchema = z.object({
    type: z.string().min(1).max(100),
    category: z.string().min(1).max(100),
    description: z.string().min(1).max(5000),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    priorityScore: z.number().min(0).max(100).default(50),
    location: z.object({
        ward: z.string().min(1).max(100),
        address: z.string().min(1).max(500),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    citizenName: z.string().max(100).optional(),
    citizenPhone: z.string().max(20).optional(),
    imageUrl: z.string().url().optional(),
});

/**
 * GET /api/tickets - List tickets with role-based filtering
 */
export async function GET(request: NextRequest) {
    try {
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

        // 2. Build query based on role
        let query = adminDb().collection('tickets').orderBy('createdAt', 'desc');

        // Department HQ only sees their department's tickets
        if (decodedToken.role === 'department_hq' && decodedToken.department) {
            query = query.where('assignedDepartment', '==', decodedToken.department);
        }

        // Ward officer sees all but can only modify their ward (handled in PATCH)

        // 3. Execute query with pagination
        const searchParams = request.nextUrl.searchParams;
        const limitParam = parseInt(searchParams.get('limit') || '50');
        const limit = Math.min(Math.max(1, limitParam), 100); // 1-100 range

        const snapshot = await query.limit(limit).get();

        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
            slaDeadline: doc.data().slaDeadline?.toDate?.()?.toISOString() || null,
        }));

        return NextResponse.json({ tickets });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Tickets GET Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

/**
 * POST /api/tickets - Create a new ticket
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Rate limiting
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const rateLimit = checkRateLimit(
            createRateLimitKey(clientIp, undefined, 'ticket_create'),
            RATE_LIMITS.ticket_create
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

        // 3. RBAC - only super_admin and dispatcher can create tickets
        if (!hasPermission(decodedToken.role, 'write')) {
            return NextResponse.json({ error: 'Forbidden: Cannot create tickets' }, { status: 403 });
        }

        // 4. Validate request body
        const body = await request.json();
        const validationResult = CreateTicketSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // 5. Generate ticket ID and number
        const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const ticketNumber = Math.floor(1000 + Math.random() * 9000);

        // 6. Calculate SLA deadline based on priority
        const slaHours: Record<string, number> = {
            critical: 4,
            high: 8,
            medium: 24,
            low: 48,
        };
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + (slaHours[validatedData.priority] || 24));

        // 7. Create ticket document
        const now = Timestamp.now();
        const ticketData = {
            ...validatedData,
            id: ticketId,
            ticketNumber,
            status: 'open',
            slaDeadline: Timestamp.fromDate(deadline),
            slaStage: 'on_track',
            reportCount: 1,
            createdAt: now,
            updatedAt: now,
            activityLog: [{
                id: crypto.randomUUID(),
                timestamp: now,
                action: 'Ticket created',
                actor: decodedToken.email || 'System',
                actorRole: decodedToken.role || 'unknown',
            }],
            internalNotes: [],
        };

        await adminDb().collection('tickets').doc(ticketId).set(ticketData);

        // 8. Create audit log
        await createAuditLog({
            userId: decodedToken.uid,
            userName: decodedToken.email || 'Unknown',
            action: 'ticket_created',
            targetType: 'ticket',
            targetId: ticketId,
            newValue: { ticketNumber, type: validatedData.type, category: validatedData.category },
            ipAddress: clientIp,
        });

        // 9. Return created ticket
        return NextResponse.json(
            {
                ticket: {
                    ...ticketData,
                    createdAt: now.toDate().toISOString(),
                    updatedAt: now.toDate().toISOString(),
                    slaDeadline: deadline.toISOString(),
                }
            },
            { status: 201, headers: getRateLimitHeaders(rateLimit) }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Tickets POST Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
