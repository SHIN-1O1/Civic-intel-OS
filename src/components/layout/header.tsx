"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, Moon, Sun, User, ChevronDown, LogOut } from "lucide-react";
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

export function Header() {
    const [isDark, setIsDark] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        // Set dark mode by default for "Control Room" feel
        document.documentElement.classList.add("dark");
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    const handleSignOut = () => {
        // Navigate to login page
        router.push("/login");
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

                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {isDark ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]">
                                3
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                                Mark all read
                            </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-destructive"></span>
                                <span className="text-sm font-medium">SLA Breach Alert</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ticket #1021 has breached SLA deadline
                            </p>
                            <span className="text-[10px] text-muted-foreground">2 minutes ago</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                <span className="text-sm font-medium">Priority Escalation</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ticket #1024 escalated to critical priority
                            </p>
                            <span className="text-[10px] text-muted-foreground">15 minutes ago</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                                <span className="text-sm font-medium">New Assignment</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                3 tickets auto-assigned to available teams
                            </p>
                            <span className="text-[10px] text-muted-foreground">30 minutes ago</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-sm text-primary">
                            View all notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    AD
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-medium">Administrator</span>
                                <span className="text-[10px] text-muted-foreground">Super Admin</span>
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
