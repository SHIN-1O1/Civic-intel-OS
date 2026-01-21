"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Ticket,
    Map,
    Users,
    BarChart3,
    ScrollText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

const mainNavItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/",
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        title: "Ticket Grid",
        href: "/tickets",
        icon: <Ticket className="h-5 w-5" />,
        badge: 12,
    },
    {
        title: "Dispatch Map",
        href: "/dispatch",
        icon: <Map className="h-5 w-5" />,
    },
    {
        title: "Workforce",
        href: "/workforce",
        icon: <Users className="h-5 w-5" />,
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: "Audit Logs",
        href: "/audit",
        icon: <ScrollText className="h-5 w-5" />,
    },
    {
        title: "Admin",
        href: "/admin",
        icon: <Settings className="h-5 w-5" />,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);

    const NavLink = ({ item }: { item: NavItem }) => {
        const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

        const linkContent = (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground",
                    collapsed && "justify-center px-2"
                )}
            >
                <span className={cn(
                    "flex-shrink-0",
                    isActive && "text-primary-foreground"
                )}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                            <span className={cn(
                                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                                isActive
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-destructive text-destructive-foreground"
                            )}>
                                {item.badge}
                            </span>
                        )}
                    </>
                )}
            </Link>
        );

        if (collapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                                {item.badge}
                            </span>
                        )}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return linkContent;
    };

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                {/* Header / Logo */}
                <div className={cn(
                    "flex h-16 items-center border-b border-border px-4",
                    collapsed && "justify-center px-2"
                )}>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <Shield className="h-5 w-5 text-primary-foreground" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Civic-intel-OS</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Admin Portal
                                </span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    <div className="space-y-1">
                        {!collapsed && (
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Operations
                            </p>
                        )}
                        {mainNavItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-1">
                        {!collapsed && (
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Administration
                            </p>
                        )}
                        {adminNavItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className="border-t border-border p-3">
                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "w-full justify-center",
                            !collapsed && "justify-start"
                        )}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                <span>Collapse</span>
                            </>
                        )}
                    </Button>

                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full justify-start text-muted-foreground hover:text-destructive"
                            asChild
                        >
                            <Link href="/login">
                                <LogOut className="h-4 w-4 mr-2" />
                                <span>Sign Out</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}
