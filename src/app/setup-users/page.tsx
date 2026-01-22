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
    Shield,
    Building2,
    Truck,
    Zap,
    TreePine,
    Droplets,
    PipetteIcon,
    CheckCircle2,
    Loader2,
    Copy,
    AlertTriangle,
    Eye,
    EyeOff
} from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Department, DEPARTMENT_LABELS } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";


interface PortalUserSetup {
    id: string;
    name: string;
    role: 'super_admin' | 'department_hq';
    department?: Department;
    email: string;
    icon: React.ReactNode;
    color: string;
}

const PORTAL_USERS: PortalUserSetup[] = [
    {
        id: '',
        name: 'Super Administrator',
        role: 'super_admin',
        email: 'admin@civic.gov',
        icon: <Shield className="h-5 w-5" />,
        color: 'bg-primary'
    },
    {
        id: '',
        name: 'Roads & Infrastructure HQ',
        role: 'department_hq',
        department: 'roads_infrastructure',
        email: 'roads@civic.gov',
        icon: <Truck className="h-5 w-5" />,
        color: 'bg-orange-500'
    },
    {
        id: '',
        name: 'Sanitation HQ',
        role: 'department_hq',
        department: 'sanitation',
        email: 'sanitation@civic.gov',
        icon: <Building2 className="h-5 w-5" />,
        color: 'bg-green-500'
    },
    {
        id: '',
        name: 'Electrical HQ',
        role: 'department_hq',
        department: 'electrical',
        email: 'electrical@civic.gov',
        icon: <Zap className="h-5 w-5" />,
        color: 'bg-yellow-500'
    },
    {
        id: '',
        name: 'Parks & Gardens HQ',
        role: 'department_hq',
        department: 'parks_gardens',
        email: 'parks@civic.gov',
        icon: <TreePine className="h-5 w-5" />,
        color: 'bg-emerald-500'
    },
    {
        id: '',
        name: 'Water Supply HQ',
        role: 'department_hq',
        department: 'water_supply',
        email: 'water@civic.gov',
        icon: <Droplets className="h-5 w-5" />,
        color: 'bg-blue-500'
    },
    {
        id: '',
        name: 'Drainage HQ',
        role: 'department_hq',
        department: 'drainage',
        email: 'drainage@civic.gov',
        icon: <PipetteIcon className="h-5 w-5" />,
        color: 'bg-slate-500'
    }
];

export default function SetupPortalUsersPage() {
    const [password, setPassword] = React.useState("admin123"); // Default password for all
    const [showPassword, setShowPassword] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [results, setResults] = React.useState<{ email: string; status: 'success' | 'error' | 'exists'; message: string }[]>([]);

    const { user, loading, isSuperAdmin, portalUser } = useAuth();
    const router = useRouter();

    // Auth guard - only super_admin can access this page
    React.useEffect(() => {
        if (!loading && (!user || !portalUser || !isSuperAdmin)) {
            router.push('/portal-select');
        }
    }, [user, portalUser, isSuperAdmin, loading, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Don't render if not authorized
    if (!user || !portalUser || !isSuperAdmin) {
        return null;
    }


    const handleCreateAllUsers = async () => {
        setIsCreating(true);
        setResults([]);
        const newResults: typeof results = [];

        for (const user of PORTAL_USERS) {
            try {
                // Create Firebase Auth user
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
                const uid = userCredential.user.uid;

                // Create Firestore portal user document
                const portalUserData: any = {
                    id: uid,
                    name: user.name,
                    role: user.role
                };
                if (user.department) {
                    portalUserData.department = user.department;
                }

                await setDoc(doc(db, 'portalUsers', uid), portalUserData);

                newResults.push({
                    email: user.email,
                    status: 'success',
                    message: `Created with UID: ${uid}`
                });
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    newResults.push({
                        email: user.email,
                        status: 'exists',
                        message: 'User already exists'
                    });
                } else {
                    newResults.push({
                        email: user.email,
                        status: 'error',
                        message: error.message || 'Failed to create'
                    });
                }
            }
        }

        setResults(newResults);
        setIsCreating(false);
    };

    const handleCreateSingleUser = async (user: PortalUserSetup) => {
        setIsCreating(true);
        setResults([]);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
            const uid = userCredential.user.uid;

            const portalUserData: any = {
                id: uid,
                name: user.name,
                role: user.role
            };
            if (user.department) {
                portalUserData.department = user.department;
            }

            await setDoc(doc(db, 'portalUsers', uid), portalUserData);

            setResults([{
                email: user.email,
                status: 'success',
                message: `Created with UID: ${uid}`
            }]);
        } catch (error: any) {
            setResults([{
                email: user.email,
                status: error.code === 'auth/email-already-in-use' ? 'exists' : 'error',
                message: error.message || 'Failed to create'
            }]);
        }

        setIsCreating(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Portal Users Setup</h1>
                    <p className="text-muted-foreground">
                        Initialize Super Admin and Department HQ accounts
                    </p>
                </div>

                {/* Warning */}
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-500">Important Security Note</p>
                            <p className="text-muted-foreground mt-1">
                                This page creates Firebase Auth users and Firestore documents.
                                Use this only for initial setup. After setup, remove or protect this page.
                                Change the default password immediately after login.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Setting */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Default Password</CardTitle>
                        <CardDescription>
                            All users will be created with this password. They should change it after first login.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="password">Password for all accounts</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <Button
                                onClick={handleCreateAllUsers}
                                disabled={isCreating || password.length < 6}
                                className="mt-auto"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Create All Users
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg ${result.status === 'success' ? 'bg-green-500/10' :
                                        result.status === 'exists' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                                        }`}
                                >
                                    <span className="font-medium">{result.email}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            result.status === 'success' ? 'default' :
                                                result.status === 'exists' ? 'secondary' : 'destructive'
                                        }>
                                            {result.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{result.message}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Separator />

                {/* User List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Portal Users</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PORTAL_USERS.map((user, index) => (
                            <Card key={index} className="overflow-hidden">
                                <div className={`h-2 ${user.color}`} />
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${user.color} text-white`}>
                                                {user.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {user.role.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Password: {password}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => navigator.clipboard.writeText(password)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCreateSingleUser(user)}
                                            disabled={isCreating}
                                        >
                                            Create
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Manual Instructions */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Login Credentials</CardTitle>
                        <CardDescription>Use these credentials after setup</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Portal</th>
                                        <th className="text-left py-2">Email</th>
                                        <th className="text-left py-2">Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PORTAL_USERS.map((user, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-2">{user.name}</td>
                                            <td className="py-2 font-mono text-xs">{user.email}</td>
                                            <td className="py-2 font-mono text-xs">{password}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
