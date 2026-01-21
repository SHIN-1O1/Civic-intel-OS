"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    trendLabel?: string;
    icon?: React.ReactNode;
    variant?: "default" | "critical" | "warning" | "success";
    pulse?: boolean;
}

export function KPICard({
    title,
    value,
    subtitle,
    trend,
    trendLabel,
    icon,
    variant = "default",
    pulse = false,
}: KPICardProps) {
    const variantStyles = {
        default: "border-border",
        critical: "border-[var(--signal-red)] bg-[var(--signal-red)]/5",
        warning: "border-[var(--amber-warning)] bg-[var(--amber-warning)]/5",
        success: "border-[var(--emerald-success)] bg-[var(--emerald-success)]/5",
    };

    const valueStyles = {
        default: "text-foreground",
        critical: "text-[var(--signal-red)]",
        warning: "text-[var(--amber-warning)]",
        success: "text-[var(--emerald-success)]",
    };

    const getTrendIcon = () => {
        if (trend === undefined) return null;
        if (trend > 0) return <TrendingUp className="h-4 w-4" />;
        if (trend < 0) return <TrendingDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getTrendColor = () => {
        if (trend === undefined) return "";
        // For response time, negative is good (faster)
        if (trendLabel?.includes("response") || trendLabel?.includes("time")) {
            return trend < 0 ? "text-[var(--emerald-success)]" : "text-[var(--signal-red)]";
        }
        // For most metrics, negative is bad
        return trend > 0 ? "text-[var(--signal-red)]" : "text-[var(--emerald-success)]";
    };

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
            variantStyles[variant]
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-center gap-3">
                            <p className={cn(
                                "text-4xl font-bold tracking-tight",
                                valueStyles[variant]
                            )}>
                                {value}
                            </p>
                            {pulse && (
                                <span className="relative flex h-3 w-3">
                                    <span className={cn(
                                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                                        variant === "critical" && "bg-[var(--signal-red)]",
                                        variant === "warning" && "bg-[var(--amber-warning)]",
                                        variant === "success" && "bg-[var(--emerald-success)]",
                                        variant === "default" && "bg-primary"
                                    )}></span>
                                    <span className={cn(
                                        "relative inline-flex h-3 w-3 rounded-full",
                                        variant === "critical" && "bg-[var(--signal-red)]",
                                        variant === "warning" && "bg-[var(--amber-warning)]",
                                        variant === "success" && "bg-[var(--emerald-success)]",
                                        variant === "default" && "bg-primary"
                                    )}></span>
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">{subtitle}</p>
                        )}
                        {trend !== undefined && (
                            <div className={cn(
                                "flex items-center gap-1 text-sm font-medium",
                                getTrendColor()
                            )}>
                                {getTrendIcon()}
                                <span>
                                    {trend > 0 ? "+" : ""}{trend} {trendLabel}
                                </span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn(
                            "rounded-lg p-3",
                            variant === "default" && "bg-muted",
                            variant === "critical" && "bg-[var(--signal-red)]/10",
                            variant === "warning" && "bg-[var(--amber-warning)]/10",
                            variant === "success" && "bg-[var(--emerald-success)]/10"
                        )}>
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
