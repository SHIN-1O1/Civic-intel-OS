"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Ticket,
    Search,
    Filter,
    Clock,
    MapPin,
    Users,
    Eye,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Department, DEPARTMENT_LABELS, Ticket as TicketType, TicketStatus, TicketPriority } from "@/lib/types";
import { FirebaseService } from "@/services/firebase-service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const firebaseService = new FirebaseService();

export default function DepartmentTicketsPage() {
    const params = useParams();
    const router = useRouter();
    const { portalUser, isSuperAdmin } = useAuth();
    const department = params.dept as Department;

    const [tickets, setTickets] = React.useState<TicketType[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

    // Validate department
    const isValidDepartment = department && DEPARTMENT_LABELS[department];

    // Real-time subscriptions
    React.useEffect(() => {
        if (!isValidDepartment) return;

        setLoading(true);
        const unsubscribe = firebaseService.subscribeToTicketsByDepartment(
            department,
            (ticketsData) => {
                setTickets(ticketsData);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [department, isValidDepartment]);

    // Access control
    React.useEffect(() => {
        if (!portalUser) {
            router.push('/portal-select');
            return;
        }
        if (!isSuperAdmin && portalUser.department !== department) {
            router.push(`/department/${portalUser.department}`);
        }
    }, [portalUser, isSuperAdmin, department, router]);

    // Filtered tickets
    const filteredTickets = React.useMemo(() => {
        return tickets.filter(ticket => {
            // Search filter
            const matchesSearch = searchQuery === "" ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.ticketNumber.toString().includes(searchQuery) ||
                ticket.location.ward.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

            // Priority filter
            const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tickets, searchQuery, statusFilter, priorityFilter]);

    const handleViewTicket = (ticketId: string) => {
        router.push(`/tickets/${ticketId}`);
    };

    const getStatusBadge = (status: TicketStatus) => {
        const variants: Record<TicketStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
            open: { variant: "outline", className: "border-yellow-500 text-yellow-500" },
            assigned: { variant: "secondary" },
            in_progress: { variant: "default", className: "bg-blue-500" },
            on_site: { variant: "default", className: "bg-purple-500" },
            resolved: { variant: "default", className: "bg-[var(--emerald-success)]" },
            closed: { variant: "secondary" }
        };
        const config = variants[status] || { variant: "secondary" };
        return <Badge variant={config.variant} className={config.className}>{status.replace('_', ' ')}</Badge>;
    };

    const getPriorityBadge = (priority: TicketPriority) => {
        const variants: Record<TicketPriority, { className: string }> = {
            critical: { className: "bg-red-500/10 text-red-500 border-red-500" },
            high: { className: "bg-orange-500/10 text-orange-500 border-orange-500" },
            medium: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500" },
            low: { className: "bg-green-500/10 text-green-500 border-green-500" }
        };
        return <Badge variant="outline" className={variants[priority]?.className}>{priority}</Badge>;
    };

    if (!isValidDepartment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive">Invalid department</p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push('/portal-select')}>
                            Back to Portal Selection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/department/${department}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {DEPARTMENT_LABELS[department]} - Tickets
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and track all tickets assigned to your department
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                            <p className="text-xs text-muted-foreground">Open</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--emerald-success)]/10">
                            <CheckCircle2 className="h-5 w-5 text-[var(--emerald-success)]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
                            <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                            <Ticket className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tickets.length}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Ticket className="h-4 w-4" />
                        Tickets ({filteredTickets.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No tickets found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket #</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Assigned Team</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">#{ticket.ticketNumber}</TableCell>
                                        <TableCell>{ticket.type}</TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                        <TableCell>
                                            {ticket.assignedTeam ? (
                                                <span className="flex items-center gap-1 text-sm">
                                                    <Users className="h-3 w-3" />
                                                    {ticket.assignedTeam}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {ticket.location.ward}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewTicket(ticket.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
