"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Building2,
    Truck,
    Zap,
    TreePine,
    Droplets,
    PipetteIcon,
    Shield,
    ArrowRight,
    Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Department, DEPARTMENT_LABELS } from "@/lib/types";

const DEPARTMENT_CONFIG: Record<Department, { icon: React.ReactNode; color: string; description: string }> = {
    roads_infrastructure: {
        icon: <Truck className="h-8 w-8" />,
        color: "from-orange-500 to-red-500",
        description: "Potholes, road damage, traffic signals"
    },
    sanitation: {
        icon: <Building2 className="h-8 w-8" />,
        color: "from-green-500 to-emerald-500",
        description: "Garbage, waste management, cleanliness"
    },
    electrical: {
        icon: <Zap className="h-8 w-8" />,
        color: "from-yellow-500 to-amber-500",
        description: "Street lights, power issues"
    },
    parks_gardens: {
        icon: <TreePine className="h-8 w-8" />,
        color: "from-green-600 to-teal-500",
        description: "Parks, trees, green spaces"
    },
    water_supply: {
        icon: <Droplets className="h-8 w-8" />,
        color: "from-blue-500 to-cyan-500",
        description: "Water supply, leaks, pipelines"
    },
    drainage: {
        icon: <PipetteIcon className="h-8 w-8" />,
        color: "from-slate-500 to-gray-600",
        description: "Drainage, sewage, flooding"
    }
};

export default function PortalSelectPage() {
    const router = useRouter();
    const { signIn, user, portalUser, loading } = useAuth();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoggingIn, setIsLoggingIn] = React.useState(false);
    const [error, setError] = React.useState("");

    // Redirect if already logged in
    React.useEffect(() => {
        if (user && portalUser) {
            if (portalUser.role === 'super_admin') {
                router.push('/');
            } else if (portalUser.department) {
                router.push(`/department/${portalUser.department}`);
            }
        }
    }, [user, portalUser, router]);

    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoggingIn(true);

        try {
            await signIn(email, password);
            router.push('/');
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleDepartmentSelect = (department: Department) => {
        // For department HQ, redirect to department-specific login
        router.push(`/portal-select/department-login?dept=${department}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-3">
                        Civic Intelligence OS
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Select your portal to continue
                    </p>
                </div>

                {/* Super Admin Portal */}
                <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/20">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Super Admin Portal</CardTitle>
                                <CardDescription>
                                    Full access to all departments, dispatch, and system configuration
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSuperAdminLogin} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="email" className="sr-only">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@civic.gov"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="password" className="sr-only">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoggingIn} className="min-w-[140px]">
                                {isLoggingIn ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                        {error && (
                            <p className="text-sm text-destructive mt-2">{error}</p>
                        )}
                    </CardContent>
                </Card>

                <Separator className="my-8" />

                {/* Department Portals */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Department HQ Portals</h2>
                    <p className="text-muted-foreground">
                        Access your department's assigned tickets and team management
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((dept) => {
                        const config = DEPARTMENT_CONFIG[dept];
                        return (
                            <Card
                                key={dept}
                                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
                                onClick={() => handleDepartmentSelect(dept)}
                            >
                                <CardContent className="p-6">
                                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${config.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                                        {config.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">
                                        {DEPARTMENT_LABELS[dept]}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {config.description}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                        Department HQ
                                    </Badge>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
