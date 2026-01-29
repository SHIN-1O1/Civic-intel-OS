import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
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
        if (!privateKey) {
            throw new Error('Firebase Admin private key not configured');
        }

        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        }, 'portal-users-app');
    } else {
        adminApp = getApps().find(app => app.name === 'portal-users-app') || getApps()[0];
    }

    return adminApp;
}

function getAdminAuth() {
    return getAuth(getAdminApp());
}

function getAdminDb() {
    return getFirestore(getAdminApp());
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

// GET - List all portal users (SUPER_ADMIN ONLY)
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifySuperAdmin(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const adminDb = getAdminDb();
        const snapshot = await adminDb.collection('portalUsers').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching portal users:', error);
        return NextResponse.json({ error: 'Failed to fetch portal users' }, { status: 500 });
    }
}

// POST - Create a new portal user (SUPER_ADMIN ONLY)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifySuperAdmin(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { name, email, password, role, department } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: name, email, password, role' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['super_admin', 'department_hq'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be super_admin or department_hq' },
                { status: 400 }
            );
        }

        // If role is department_hq, department is required
        if (role === 'department_hq' && !department) {
            return NextResponse.json(
                { error: 'Department is required for department_hq role' },
                { status: 400 }
            );
        }

        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();

        // Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // Create Firestore portal user document
        const portalUserData: Record<string, unknown> = {
            id: userRecord.uid,
            name,
            role,
        };

        if (department) {
            portalUserData.department = department;
        }

        await adminDb.collection('portalUsers').doc(userRecord.uid).set(portalUserData);

        return NextResponse.json({
            id: userRecord.uid,
            name,
            role,
            department,
            message: 'Portal user created successfully'
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error creating portal user:', error);

        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/email-already-exists') {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: firebaseError.message || 'Failed to create portal user' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a portal user (SUPER_ADMIN ONLY)
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await verifySuperAdmin(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();

        // Delete from Firebase Auth
        await adminAuth.deleteUser(userId);

        // Delete from Firestore
        await adminDb.collection('portalUsers').doc(userId).delete();

        return NextResponse.json({ message: 'Portal user deleted successfully' });

    } catch (error: unknown) {
        console.error('Error deleting portal user:', error);
        const firebaseError = error as { code?: string; message?: string };

        if (firebaseError.code === 'auth/user-not-found') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: firebaseError.message || 'Failed to delete portal user' },
            { status: 500 }
        );
    }
}
