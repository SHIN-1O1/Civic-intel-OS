"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Navigation,
    MapPin,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Truck,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { api } from "@/services/api";
import { Ticket, TicketStatus, FieldTaskStatus, DEPARTMENT_LABELS, Department } from "@/lib/types";

const statusFlow: FieldTaskStatus[] = ['assigned', 'en_route', 'on_site', 'completed'];

const statusConfig: Record<FieldTaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
    assigned: { label: 'Assigned', color: 'bg-blue-500', icon: <Clock className="h-4 w-4" /> },
    en_route: { label: 'En Route', color: 'bg-yellow-500', icon: <Truck className="h-4 w-4" /> },
    on_site: { label: 'On Site', color: 'bg-orange-500', icon: <MapPin className="h-4 w-4" /> },
    completed: { label: 'Completed', color: 'bg-emerald-500', icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function FieldAppPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [taskStatuses, setTaskStatuses] = React.useState<Record<string, FieldTaskStatus>>({});
    const [updating, setUpdating] = React.useState<string | null>(null);

    React.useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const allTickets = await api.getTickets();
            // Show assigned/in-progress tickets as field tasks
            const fieldTasks = allTickets.filter(t =>
                t.assignedTeam && t.status !== 'resolved' && t.status !== 'closed'
            );
            setTickets(fieldTasks);

            // Initialize statuses
            const initialStatuses: Record<string, FieldTaskStatus> = {};
            fieldTasks.forEach(t => {
                if (t.status === 'in_progress' || t.status === 'on_site') {
                    initialStatuses[t.id] = t.status as FieldTaskStatus;
                } else {
                    initialStatuses[t.id] = 'assigned';
                }
            });
            setTaskStatuses(initialStatuses);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const advanceStatus = async (ticketId: string) => {
        const current = taskStatuses[ticketId] || 'assigned';
        const currentIndex = statusFlow.indexOf(current);
        if (currentIndex >= statusFlow.length - 1) return; // Already completed

        const next = statusFlow[currentIndex + 1];
        setUpdating(ticketId);

        try {
            // Map field status to ticket status
            const ticketStatusMap: Record<FieldTaskStatus, string> = {
                assigned: 'assigned',
                en_route: 'in_progress',
                on_site: 'on_site',
                completed: 'resolved'
            };

            await api.updateTicket(ticketId, { status: ticketStatusMap[next] as TicketStatus });
            setTaskStatuses(prev => ({ ...prev, [ticketId]: next }));
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdating(null);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
            default: return 'text-muted-foreground';
        }
    };

    const getSLAStatus = (deadline: Date) => {
        const now = new Date();
        const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft < 0) return { label: 'BREACHED', color: 'text-red-500' };
        if (hoursLeft < 2) return { label: `${Math.round(hoursLeft * 60)}m left`, color: 'text-orange-500' };
        return { label: `${Math.round(hoursLeft)}h left`, color: 'text-muted-foreground' };
    };

    // Active vs completed
    const activeTasks = tickets.filter(t => taskStatuses[t.id] !== 'completed');
    const completedTasks = tickets.filter(t => taskStatuses[t.id] === 'completed');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Navigation className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading field tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
                    <Navigation className="h-7 w-7 text-primary" />
                    Field Operations
                </h1>
                <p className="text-muted-foreground text-sm">
                    {activeTasks.length} active tasks • {completedTasks.length} completed today
                </p>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-4 gap-2">
                {statusFlow.map(status => {
                    const count = tickets.filter(t => taskStatuses[t.id] === status).length;
                    return (
                        <div key={status} className="text-center p-2 rounded-lg bg-muted/50">
                            <div className={cn("h-8 w-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white", statusConfig[status].color)}>
                                {statusConfig[status].icon}
                            </div>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">{statusConfig[status].label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Active Tasks */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Tasks
                </h2>
                {activeTasks.map(ticket => {
                    const currentStatus = taskStatuses[ticket.id] || 'assigned';
                    const currentIndex = statusFlow.indexOf(currentStatus);
                    const nextStatus = currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
                    const sla = getSLAStatus(ticket.slaDeadline);

                    return (
                        <Card key={ticket.id} className={cn(
                            "transition-all",
                            ticket.priority === 'critical' && "border-red-500/30"
                        )}>
                            <CardContent className="p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold">#{ticket.ticketNumber}</span>
                                            <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{ticket.category}</p>
                                    </div>
                                    <Badge className={cn("text-white", statusConfig[currentStatus].color)}>
                                        {statusConfig[currentStatus].icon}
                                        <span className="ml-1">{statusConfig[currentStatus].label}</span>
                                    </Badge>
                                </div>

                                {/* Description */}
                                <p className="text-sm mb-3 line-clamp-2">{ticket.description}</p>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{ticket.location.address || ticket.location.ward}</span>
                                </div>

                                {/* SLA + Department */}
                                <div className="flex items-center justify-between text-xs mb-4">
                                    <span className={sla.color}>
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        SLA: {sla.label}
                                    </span>
                                    {ticket.assignedDepartment && (
                                        <span className="text-muted-foreground">
                                            {DEPARTMENT_LABELS[ticket.assignedDepartment as Department]}
                                        </span>
                                    )}
                                </div>

                                {/* Progress Steps */}
                                <div className="flex items-center gap-1 mb-4">
                                    {statusFlow.map((step, i) => (
                                        <React.Fragment key={step}>
                                            <div className={cn(
                                                "h-2 flex-1 rounded-full transition-all",
                                                i <= currentIndex ? statusConfig[step].color : "bg-muted"
                                            )} />
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Action Button */}
                                {nextStatus && (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={() => advanceStatus(ticket.id)}
                                        disabled={updating === ticket.id}
                                    >
                                        {updating === ticket.id ? (
                                            "Updating..."
                                        ) : (
                                            <>
                                                {statusConfig[nextStatus].icon}
                                                <span className="ml-2">Mark as {statusConfig[nextStatus].label}</span>
                                                <ArrowRight className="h-4 w-4 ml-auto" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
                {activeTasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>All tasks completed!</p>
                        <p className="text-sm">No active field assignments.</p>
                    </div>
                )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Completed ({completedTasks.length})
                    </h2>
                    {completedTasks.map(ticket => (
                        <Card key={ticket.id} className="opacity-60">
                            <CardContent className="p-3 flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">#{ticket.ticketNumber} • {ticket.category}</p>
                                    <p className="text-xs text-muted-foreground truncate">{ticket.location.ward}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">Done</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
