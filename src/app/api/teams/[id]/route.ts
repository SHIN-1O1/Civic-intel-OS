import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, hasPermission, createAuditLog, adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

const UpdateTeamSchema = z.object({
    status: z.enum(['available', 'busy', 'offline']).optional(),
    currentTask: z.string().max(500).optional().nullable(),
    currentTaskLocation: z.string().max(500).optional().nullable(),
    capacity: z.object({
        current: z.number().min(0).max(100),
        max: z.number().min(1).max(100),
    }).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id] - Get a single team
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

        // 2. Fetch team
        const teamRef = adminDb().collection('teams').doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const teamData = teamDoc.data();

        return NextResponse.json({
            team: {
                id: teamDoc.id,
                ...teamData,
                shiftEnd: teamData?.shiftEnd?.toDate?.()?.toISOString() || null,
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Team GET Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

/**
 * PATCH /api/teams/[id] - Update a team
 */
export async function PATCH(
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

        // 2. Only super_admin and dispatcher can update teams
        if (!hasPermission(decodedToken.role, 'assign')) {
            return NextResponse.json({ error: 'Forbidden: Cannot update teams' }, { status: 403 });
        }

        // 3. Validate request body
        const body = await request.json();
        const validationResult = UpdateTeamSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // 4. Check team exists
        const teamRef = adminDb().collection('teams').doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const existingData = teamDoc.data();

        // 5. Update team
        await teamRef.update(validatedData);

        // 6. Create audit log
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        await createAuditLog({
            userId: decodedToken.uid,
            userName: decodedToken.email || 'Unknown',
            action: 'team_updated',
            targetType: 'team',
            targetId: id,
            oldValue: { status: existingData?.status, currentTask: existingData?.currentTask },
            newValue: validatedData,
            ipAddress: clientIp,
        });

        // 7. Return updated team
        const updatedDoc = await teamRef.get();
        const updatedData = updatedDoc.data();

        return NextResponse.json({
            team: {
                id: updatedDoc.id,
                ...updatedData,
                shiftEnd: updatedData?.shiftEnd?.toDate?.()?.toISOString() || null,
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Team PATCH Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }
}
