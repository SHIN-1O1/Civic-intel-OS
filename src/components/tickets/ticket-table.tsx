"use client";

import * as React from "react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Clock,
    Users2,
    ExternalLink,
    Copy,
    UserPlus,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Ticket } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface TicketTableProps {
    tickets: Ticket[];
    selectedTickets: string[];
    onSelectTicket: (ticketId: string) => void;
    onSelectAll: () => void;
}

export function TicketTable({
    tickets,
    selectedTickets,
    onSelectTicket,
    onSelectAll,
}: TicketTableProps) {
    const isAllSelected = tickets.length > 0 && selectedTickets.length === tickets.length;
    const isSomeSelected = selectedTickets.length > 0 && selectedTickets.length < tickets.length;

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
            open: { variant: "secondary" },
            assigned: { variant: "outline", className: "border-primary text-primary" },
            in_progress: { variant: "default", className: "bg-[var(--govt-blue)]" },
            on_site: { variant: "default", className: "bg-[var(--amber-warning)] text-black" },
            resolved: { variant: "default", className: "bg-[var(--emerald-success)]" },
            closed: { variant: "secondary", className: "opacity-50" },
        };

        const config = statusConfig[status] || { variant: "secondary" as const };
        return (
            <Badge variant={config.variant} className={cn("capitalize", config.className)}>
                {status.replace(/_/g, " ")}
            </Badge>
        );
    };

    const getSlaIndicator = (ticket: Ticket) => {
        const timeRemaining = formatDistanceToNow(ticket.slaDeadline, { addSuffix: false });
        const isBreached = new Date() > ticket.slaDeadline;

        return (
            <div className={cn(
                "flex items-center gap-1.5 text-sm font-mono",
                ticket.slaStage === "breached" && "text-[var(--signal-red)]",
                ticket.slaStage === "at_risk" && "text-[var(--amber-warning)]",
                ticket.slaStage === "on_track" && "text-[var(--emerald-success)]",
            )}>
                <Clock className="h-3.5 w-3.5" />
                <span>
                    {isBreached ? `Breached ${timeRemaining} ago` : timeRemaining}
                </span>
            </div>
        );
    };

    return (
        <div className="rounded-lg border border-border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={isSomeSelected ? "indeterminate" : isAllSelected}
                                onCheckedChange={onSelectAll}
                            />
                        </TableHead>
                        <TableHead className="w-[150px]">ID / Type</TableHead>
                        <TableHead className="w-[100px]">Priority</TableHead>
                        <TableHead className="w-[200px]">Location</TableHead>
                        <TableHead className="w-[100px]">Reports</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[150px]">SLA Timer</TableHead>
                        <TableHead className="w-[150px]">Assignee</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow
                            key={ticket.id}
                            className={cn(
                                "group cursor-pointer",
                                selectedTickets.includes(ticket.id) && "bg-muted/50"
                            )}
                        >
                            <TableCell>
                                <Checkbox
                                    checked={selectedTickets.includes(ticket.id)}
                                    onCheckedChange={() => onSelectTicket(ticket.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <Link href={`/tickets/${ticket.id}`} className="block">
                                    <div>
                                        <span className="font-medium text-primary hover:underline">
                                            #{ticket.ticketNumber}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {ticket.type}
                                        </p>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn(
                                            "font-semibold",
                                            ticket.priorityScore >= 80 && "text-[var(--signal-red)]",
                                            ticket.priorityScore >= 60 && ticket.priorityScore < 80 && "text-[var(--amber-warning)]",
                                            ticket.priorityScore < 60 && "text-[var(--emerald-success)]"
                                        )}>
                                            {ticket.priorityScore}
                                        </span>
                                        <span className="text-muted-foreground">/100</span>
                                    </div>
                                    <Progress
                                        value={ticket.priorityScore}
                                        className="h-1.5"
                                        // @ts-ignore
                                        indicatorClassName={cn(
                                            ticket.priorityScore >= 80 && "bg-[var(--signal-red)]",
                                            ticket.priorityScore >= 60 && ticket.priorityScore < 80 && "bg-[var(--amber-warning)]",
                                            ticket.priorityScore < 60 && "bg-[var(--emerald-success)]"
                                        )}
                                    />
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-[180px]">
                                    <p className="font-medium truncate">{ticket.location.ward}</p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {ticket.location.address}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell>
                                {ticket.reportCount > 1 ? (
                                    <Badge variant="secondary" className="gap-1">
                                        <Copy className="h-3 w-3" />
                                        Merged ({ticket.reportCount})
                                    </Badge>
                                ) : (
                                    <span className="text-sm text-muted-foreground">1</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(ticket.status)}
                            </TableCell>
                            <TableCell>
                                {getSlaIndicator(ticket)}
                            </TableCell>
                            <TableCell>
                                {ticket.assignedTeam ? (
                                    <div className="flex items-center gap-1.5">
                                        <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm">{ticket.assignedTeam}</span>
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="text-xs">
                                        Unassigned
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={`/tickets/${ticket.id}`}>
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Assign Team
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Escalate
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark Resolved
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
