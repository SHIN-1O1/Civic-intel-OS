"use client";

import * as React from "react";
import {
    onAuthStateChanged,
    onIdTokenChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { Department, PortalUser, DEPARTMENT_LABELS } from "@/lib/types";

interface AuthContextType {
    user: FirebaseUser | null;
    portalUser: PortalUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<string | null>;
    isSuperAdmin: boolean;
    isDepartmentHQ: boolean;
    currentDepartment: Department | null;
    departmentLabel: string | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Token refresh interval (refresh 5 minutes before expiry, Firebase tokens last 1 hour)
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<FirebaseUser | null>(null);
    const [portalUser, setPortalUser] = React.useState<PortalUser | null>(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    // Fetch portal user data from Firestore
    const fetchPortalUser = React.useCallback(async (firebaseUser: FirebaseUser) => {
        try {
            const userDoc = await getDoc(doc(db, 'portalUsers', firebaseUser.uid));
            if (userDoc.exists()) {
                setPortalUser(userDoc.data() as PortalUser);
            } else {
                // SECURITY: Do NOT default to super_admin - deny access for unknown users
                // Users must have explicit portal configuration in Firestore
                console.warn('[Auth] User not found in portalUsers collection - access denied');
                setPortalUser(null);
            }
        } catch (error) {
            console.error('[Auth] Error fetching portal user:', error);
            setPortalUser(null);
        }
    }, []);

    // Auth state listener
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await fetchPortalUser(firebaseUser);
            } else {
                setPortalUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchPortalUser]);

    // Token refresh listener - keeps token fresh automatically
    React.useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Token has been refreshed, update user state
                setUser(firebaseUser);

                // Set cookie for middleware
                try {
                    const token = await firebaseUser.getIdToken();
                    // Set secure cookie
                    document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
                } catch (e) {
                    console.error('[Auth] Failed to set auth cookie:', e);
                }
            } else {
                // Clear cookie
                document.cookie = `firebase-auth-token=; path=/; max-age=0`;
            }
        });

        return () => unsubscribe();
    }, []);

    // Proactive token refresh - refresh before expiry
    React.useEffect(() => {
        if (!user) return;

        const refreshInterval = setInterval(async () => {
            try {
                await user.getIdToken(true); // Force refresh
            } catch (error) {
                console.error('[Auth] Token refresh failed:', error);
            }
        }, TOKEN_REFRESH_INTERVAL);

        return () => clearInterval(refreshInterval);
    }, [user]);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        document.cookie = `firebase-auth-token=; path=/; max-age=0`;
        setPortalUser(null);
        router.push('/portal-select');
    };

    // Manual token refresh function
    const refreshToken = async (): Promise<string | null> => {
        if (!user) return null;
        try {
            const token = await user.getIdToken(true);
            return token;
        } catch (error) {
            console.error('[Auth] Manual token refresh failed:', error);
            return null;
        }
    };

    const value: AuthContextType = {
        user,
        portalUser,
        loading,
        signIn,
        signOut,
        refreshToken,
        isSuperAdmin: portalUser?.role === 'super_admin',
        isDepartmentHQ: portalUser?.role === 'department_hq',
        currentDepartment: portalUser?.department || null,
        departmentLabel: portalUser?.department ? DEPARTMENT_LABELS[portalUser.department] : null
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook for department-specific access
export function useDepartmentAccess(requiredDepartment?: Department) {
    const { portalUser, isSuperAdmin, currentDepartment } = useAuth();

    // Super admin can access everything
    if (isSuperAdmin) return true;

    // If no specific department required, just check if user is logged in
    if (!requiredDepartment) return !!portalUser;

    // Check if user's department matches
    return currentDepartment === requiredDepartment;
}
