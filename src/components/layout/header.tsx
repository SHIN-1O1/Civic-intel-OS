"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Moon, Sun, User, ChevronDown, LogOut, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function Header() {
    const [isDark, setIsDark] = React.useState(true);
    const router = useRouter();
    const { user, portalUser, signOut, isSuperAdmin, departmentLabel, loading } = useAuth();

    React.useEffect(() => {
        // Set dark mode by default for "Control Room" feel
        document.documentElement.classList.add("dark");
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    const handleSignOut = async () => {
        await signOut();
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (!portalUser?.name) return "AD";
        const parts = portalUser.name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return portalUser.name.slice(0, 2).toUpperCase();
    };

    // Get role display text
    const getRoleDisplay = () => {
        if (isSuperAdmin) return "Super Admin";
        if (departmentLabel) return `${departmentLabel} HQ`;
        return "User";
    };

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search tickets, teams, or locations..."
                        className="w-full pl-10 bg-muted/50"
                    />
                </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
                {/* Live indicator */}
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Live
                    </span>
                </div>

                {/* Role Badge */}
                {portalUser && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "hidden sm:flex items-center gap-1.5 px-2.5 py-1",
                            isSuperAdmin
                                ? "border-primary/50 text-primary"
                                : "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                        )}
                    >
                        {isSuperAdmin ? (
                            <Shield className="h-3 w-3" />
                        ) : (
                            <Building2 className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">{getRoleDisplay()}</span>
                    </Badge>
                )}

                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {isDark ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>

                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn(
                                    "text-sm text-white",
                                    isSuperAdmin ? "bg-primary" : "bg-emerald-600"
                                )}>
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-medium">
                                    {portalUser?.name || "Loading..."}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {getRoleDisplay()}
                                </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            Preferences
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={handleSignOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
