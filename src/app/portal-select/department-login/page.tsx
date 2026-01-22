"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Department, DEPARTMENT_LABELS } from "@/lib/types";

function DepartmentLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const department = searchParams.get('dept') as Department | null;
    const { signIn } = useAuth();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoggingIn, setIsLoggingIn] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!department) return;

        setError("");
        setIsLoggingIn(true);

        try {
            await signIn(email, password);
            router.push(`/department/${department}`);
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!department || !DEPARTMENT_LABELS[department]) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive">Invalid department selected</p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push('/portal-select')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Portal Selection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit mb-4"
                        onClick={() => router.push('/portal-select')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <CardTitle className="text-2xl">
                        {DEPARTMENT_LABELS[department]} HQ
                    </CardTitle>
                    <CardDescription>
                        Sign in to access your department portal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={`${department}@civic.gov`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoggingIn}>
                            {isLoggingIn ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Sign In to {DEPARTMENT_LABELS[department]}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DepartmentLoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <DepartmentLoginContent />
        </React.Suspense>
    );
}
