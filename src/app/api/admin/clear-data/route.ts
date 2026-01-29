import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { verifyFirebaseToken, hasPermission } from '@/lib/firebase-admin';

// Lazy initialization helper
let adminApp: App | null = null;

function getAdminApp(): App {
    if (adminApp) return adminApp;

    if (!getApps().length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!privateKey) {
            throw new Error('FIREBASE_PRIVATE_KEY environment variable is not configured');
        }
        if (!projectId) {
            throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not configured');
        }
        if (!clientEmail) {
            throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not configured');
        }

        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        }, 'admin-clear-data');
    } else {
        adminApp = getApps().find(app => app.name === 'admin-clear-data') || getApps()[0];
    }

    return adminApp;
}

function getAdminDb() {
    getAdminApp();
    return getFirestore();
}

// Helper to verify super_admin access
async function verifySuperAdmin(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized - No token provided', status: 401 };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
        return { error: 'Invalid token', status: 401 };
    }

    if (!hasPermission(decodedToken.role, 'admin')) {
        return { error: 'Forbidden - Super Admin access required', status: 403 };
    }

    return { user: decodedToken };
}

// DELETE - Clear all seeded/mock data from Firebase (SUPER_ADMIN ONLY)
export async function DELETE(request: NextRequest) {
    try {
        // Verify super_admin access
        const authResult = await verifySuperAdmin(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const adminDb = getAdminDb();

        const collectionsToClean = ['tickets', 'teams', 'users', 'auditLogs', 'systemFeed', 'wardStats'];
        const results: Record<string, number> = {};

        for (const collectionName of collectionsToClean) {
            try {
                const snapshot = await adminDb.collection(collectionName).get();

                const docs = snapshot.docs;
                let count = 0;

                for (let i = 0; i < docs.length; i += 500) {
                    const batch = adminDb.batch();
                    const batchDocs = docs.slice(i, i + 500);

                    batchDocs.forEach(doc => {
                        batch.delete(doc.ref);
                        count++;
                    });

                    await batch.commit();
                }

                results[collectionName] = count;
            } catch (collectionError) {
                console.error(`Error clearing ${collectionName}:`, collectionError);
                results[collectionName] = -1;
            }
        }

        try {
            await adminDb.doc('analytics/kpi').delete();
            results['analytics'] = 1;
        } catch {
            results['analytics'] = 0;
        }

        return NextResponse.json({
            message: 'Database cleared successfully',
            deletedCounts: results
        });

    } catch (error) {
        console.error('Error clearing database:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to clear database',
            details: errorMessage
        }, { status: 500 });
    }
}

// GET - Get counts of data in each collection (SUPER_ADMIN ONLY)
export async function GET(request: NextRequest) {
    try {
        // Verify super_admin access
        const authResult = await verifySuperAdmin(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const adminDb = getAdminDb();

        const collections = ['tickets', 'teams', 'users', 'portalUsers', 'auditLogs', 'systemFeed'];
        const counts: Record<string, number> = {};

        for (const collectionName of collections) {
            try {
                const snapshot = await adminDb.collection(collectionName).get();
                counts[collectionName] = snapshot.size;
            } catch {
                counts[collectionName] = -1;
            }
        }

        return NextResponse.json({ counts });

    } catch (error) {
        console.error('Error getting counts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to get counts',
            details: errorMessage
        }, { status: 500 });
    }
}
