import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side only)
let adminApp: App;

function getAdminApp(): App {
    if (getApps().length === 0) {
        // Use service account credentials from environment
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    return adminApp || getApps()[0];
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());

// Extended token type with role information
export interface DecodedTokenWithRole extends DecodedIdToken {
    role?: 'super_admin' | 'dispatcher' | 'ward_officer' | 'analyst' | 'department_hq';
    department?: string;
    wardAssignment?: string;
}

/**
 * Verifies a Firebase ID token and enriches it with user role from Firestore
 * @param idToken - The Firebase ID token from the client
 * @returns Decoded token with role, or null if invalid
 */
export async function verifyFirebaseToken(
    idToken: string
): Promise<DecodedTokenWithRole | null> {
    try {
        const decodedToken = await adminAuth().verifyIdToken(idToken);

        // Fetch user role from Firestore (server-side)
        const userDoc = await adminDb()
            .collection('portalUsers')
            .doc(decodedToken.uid)
            .get();

        if (!userDoc.exists) {
            console.warn(`[Auth] User ${decodedToken.uid} not found in portalUsers`);
            return null;
        }

        const userData = userDoc.data();

        // Also fetch additional user data for ward assignment
        const usersDoc = await adminDb()
            .collection('users')
            .doc(decodedToken.uid)
            .get();

        const usersData = usersDoc.exists ? usersDoc.data() : {};

        return {
            ...decodedToken,
            role: userData?.role,
            department: userData?.department,
            wardAssignment: usersData?.wardAssignment,
        };
    } catch (error) {
        console.error('[Auth] Token verification failed:', error);
        return null;
    }
}

// RBAC permission matrix
export const ROLE_PERMISSIONS = {
    super_admin: ['read', 'write', 'delete', 'assign', 'admin', 'audit', 'ai_assess'],
    dispatcher: ['read', 'write', 'assign', 'ai_assess'],
    ward_officer: ['read', 'write_own_ward'],
    analyst: ['read'],
    department_hq: ['read_department', 'write_department'],
} as const;

export type Permission =
    | 'read'
    | 'write'
    | 'delete'
    | 'assign'
    | 'admin'
    | 'audit'
    | 'ai_assess'
    | 'write_own_ward'
    | 'read_department'
    | 'write_department';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
    role: keyof typeof ROLE_PERMISSIONS | undefined,
    permission: Permission
): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] as readonly string[];
    return permissions?.includes(permission) ?? false;
}

/**
 * Check if user can access a specific ticket based on their role
 */
export function canAccessTicket(
    user: DecodedTokenWithRole,
    ticketData: {
        assignedDepartment?: string;
        location?: { ward?: string };
    }
): { canRead: boolean; canWrite: boolean } {
    const role = user.role;

    if (!role) {
        return { canRead: false, canWrite: false };
    }

    // Super admin and dispatcher have full access
    if (role === 'super_admin' || role === 'dispatcher') {
        return { canRead: true, canWrite: true };
    }

    // Analyst has read-only access to all
    if (role === 'analyst') {
        return { canRead: true, canWrite: false };
    }

    // Ward officer can only access tickets in their ward
    if (role === 'ward_officer') {
        const isOwnWard = ticketData.location?.ward === user.wardAssignment;
        return { canRead: true, canWrite: isOwnWard };
    }

    // Department HQ can only access tickets assigned to their department
    if (role === 'department_hq') {
        const isOwnDepartment = ticketData.assignedDepartment === user.department;
        return { canRead: isOwnDepartment, canWrite: isOwnDepartment };
    }

    return { canRead: false, canWrite: false };
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: {
    userId: string;
    userName: string;
    action: string;
    targetType: string;
    targetId: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress: string;
}): Promise<void> {
    try {
        await adminDb().collection('auditLogs').add({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            ...entry,
            oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
            newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        });
    } catch (error) {
        console.error('[Audit] Failed to create audit log:', error);
        // Don't throw - audit log failure shouldn't break the operation
    }
}
