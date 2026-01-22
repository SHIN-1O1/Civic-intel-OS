import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/audit-logs - List audit logs (super_admin only)
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

        // 2. Only super_admin can view audit logs
        if (decodedToken.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only super_admin can access audit logs' },
                { status: 403 }
            );
        }

        // 3. Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const limitParam = parseInt(searchParams.get('limit') || '50');
        const limit = Math.min(Math.max(1, limitParam), 200); // 1-200 range

        const actionFilter = searchParams.get('action');
        const targetTypeFilter = searchParams.get('targetType');

        // 4. Build query
        const query = adminDb()
            .collection('auditLogs')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        // Note: Firestore requires composite indexes for multiple where clauses
        // For production, create indexes or filter client-side

        const snapshot = await query.get();

        interface AuditLogEntry {
            id: string;
            timestamp: string;
            action?: string;
            targetType?: string;
            userId?: string;
            userName?: string;
            targetId?: string;
            oldValue?: string;
            newValue?: string;
            ipAddress?: string;
            [key: string]: unknown;
        }

        let logs: AuditLogEntry[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
            } as AuditLogEntry;
        });

        // Apply filters (client-side for simplicity - use indexes in production)
        if (actionFilter) {
            logs = logs.filter(log => log.action === actionFilter);
        }
        if (targetTypeFilter) {
            logs = logs.filter(log => log.targetType === targetTypeFilter);
        }

        return NextResponse.json({
            logs,
            meta: {
                count: logs.length,
                limit,
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Audit Logs GET Error]:', errorMessage);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}

// No POST/PATCH/DELETE - audit logs are created server-side only
// and should never be modified or deleted
