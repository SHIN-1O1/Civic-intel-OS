"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, portalUser } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        // Redirect to portal select if not authenticated or no portal user
        if (!loading && (!user || !portalUser)) {
            router.push('/portal-select');
        }
    }, [user, portalUser, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard if not authenticated
    if (!user || !portalUser) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
