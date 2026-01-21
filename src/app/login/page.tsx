"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Lock, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
    const [officerId, setOfficerId] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [role, setRole] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate login - redirect to dashboard
        setTimeout(() => {
            window.location.href = "/";
        }, 1000);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Civic-intel-OS</h1>
                            <p className="text-lg text-slate-400 uppercase tracking-widest">Operating System</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-6 max-w-md">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-[var(--govt-blue)]/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[var(--govt-blue)] font-bold">01</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Real-time Issue Tracking</h3>
                                <p className="text-sm text-slate-400">Monitor and manage citizen complaints across all wards with AI-powered prioritization.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-[var(--emerald-success)]/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[var(--emerald-success)] font-bold">02</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Intelligent Dispatch</h3>
                                <p className="text-sm text-slate-400">Automated team assignment based on proximity, skill match, and workload balancing.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-[var(--amber-warning)]/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[var(--amber-warning)] font-bold">03</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">SLA Compliance</h3>
                                <p className="text-sm text-slate-400">Complete audit trails and automated alerts ensure government accountability standards.</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 flex gap-8">
                        <div>
                            <p className="text-3xl font-bold">1,240+</p>
                            <p className="text-sm text-slate-400">Issues Resolved</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">98%</p>
                            <p className="text-sm text-slate-400">SLA Compliance</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">450+</p>
                            <p className="text-sm text-slate-400">Hours Saved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                            <Shield className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Civic-intel-OS</h1>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-2xl font-bold tracking-tight">Secure Login</h2>
                            <p className="text-muted-foreground">
                                Enter your credentials to access the admin portal
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="officer-id">Officer ID</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="officer-id"
                                        placeholder="Enter your officer ID"
                                        value={officerId}
                                        onChange={(e) => setOfficerId(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                        <SelectItem value="ward_officer">Ward Officer</SelectItem>
                                        <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" />
                                    <Label htmlFor="remember" className="text-sm font-normal">
                                        Remember this device
                                    </Label>
                                </div>
                                <Button variant="link" className="px-0 text-sm">
                                    Forgot password?
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full" size="lg">
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Log in with Govt Workspace
                        </Button>
                    </div>

                    {/* Compliance Footer */}
                    <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                            <span className="font-semibold text-foreground">⚠️ Official Government System</span>
                            <br />
                            Unauthorized access is a criminal offense under the IT Act, 2000.
                            <br />
                            Your IP address and session activity are being logged.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
