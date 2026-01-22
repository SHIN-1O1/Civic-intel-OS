import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, hasPermission, adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/teams - List all teams
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

        // 2. Build query - department HQ only sees their department's teams
        const teamsCollection = adminDb().collection('teams');
        let departmentFilter: string | null = null;

        if (decodedToken.role === 'department_hq' && decodedToken.department) {
            // Map department key to display name for query
            const departmentLabels: Record<string, string> = {
                roads_infrastructure: 'Roads & Infrastructure',
                sanitation: 'Sanitation',
                electrical: 'Electrical',
                parks_gardens: 'Parks & Gardens',
                water_supply: 'Water Supply',
                drainage: 'Drainage',
            };
            departmentFilter = departmentLabels[decodedToken.department] || null;
        }

        const snapshot = departmentFilter
            ? await teamsCollection.where('department', '==', departmentFilter).get()
            : await teamsCollection.get();

        const teams = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            shiftEnd: doc.data().shiftEnd?.toDate?.()?.toISOString() || null,
        }));

        return NextResponse.json({ teams });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Teams GET Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}
