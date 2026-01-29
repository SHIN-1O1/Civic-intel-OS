"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    AlertTriangle,
    Bot,
    Clock,
    ExternalLink,
    Zap,
    Copy,
    CheckCircle,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket, SystemFeedItem } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ActionStreamProps {
    urgentTickets: Ticket[];
    systemFeed: SystemFeedItem[];
}

export function ActionStream({ urgentTickets, systemFeed }: ActionStreamProps) {
    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Urgent Inbox */}
            <Card className="flex-1 flex flex-col border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-[var(--signal-red)]" />
                            Urgent Inbox
                        </CardTitle>
                        <Badge variant="destructive" className="text-xs">
                            {urgentTickets.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-1 px-4 pb-4">
                            {urgentTickets.map((ticket, index) => (
                                <React.Fragment key={ticket.id}>
                                    <Link href={`/tickets/${ticket.id}`} className="block">
                                        <div className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background/50">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--signal-red)]/20">
                                                <span className="text-sm font-bold text-[var(--signal-red)]">
                                                    {ticket.priorityScore}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        #{ticket.ticketNumber}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {ticket.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {ticket.location?.ward ?? "Unknown location"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(ticket.slaDeadline, { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                    {index < urgentTickets.length - 1 && (
                                        <Separator className="my-1" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* System Feed */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Bot className="h-4 w-4 text-primary" />
                        System Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-3 px-4 pb-4">
                            {systemFeed.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3"
                                >
                                    <div className={cn(
                                        "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                                        item.type === "auto_assign" && "bg-primary/20",
                                        item.type === "duplicate_flagged" && "bg-[var(--amber-warning)]/20",
                                        item.type === "sla_warning" && "bg-[var(--signal-red)]/20",
                                        item.type === "escalation" && "bg-[var(--signal-red)]/20",
                                        item.type === "resolution" && "bg-[var(--emerald-success)]/20"
                                    )}>
                                        {item.type === "auto_assign" && (
                                            <Zap className="h-3 w-3 text-primary" />
                                        )}
                                        {item.type === "duplicate_flagged" && (
                                            <Copy className="h-3 w-3 text-[var(--amber-warning)]" />
                                        )}
                                        {item.type === "sla_warning" && (
                                            <Clock className="h-3 w-3 text-[var(--signal-red)]" />
                                        )}
                                        {item.type === "escalation" && (
                                            <AlertTriangle className="h-3 w-3 text-[var(--signal-red)]" />
                                        )}
                                        {item.type === "resolution" && (
                                            <CheckCircle className="h-3 w-3 text-[var(--emerald-success)]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed">
                                            {item.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
