"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Ticket,
    Users,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MapPin,
    Phone,
    Eye,
    LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Department, DEPARTMENT_LABELS, Ticket as TicketType, Team } from "@/lib/types";
import { FirebaseService } from "@/services/firebase-service";
import { format } from "date-fns";
import { toast } from "sonner";

const firebaseService = new FirebaseService();

export default function DepartmentDashboard() {
    const params = useParams();
    const router = useRouter();
    const { portalUser, signOut, isSuperAdmin } = useAuth();
    const department = params.dept as Department;

    const [tickets, setTickets] = React.useState<TicketType[]>([]);
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Validate department
    const isValidDepartment = department && DEPARTMENT_LABELS[department];

    // Real-time subscriptions
    React.useEffect(() => {
        if (!isValidDepartment) return;

        setLoading(true);

        // Subscribe to tickets for this department - auto-refresh
        const unsubscribeTickets = firebaseService.subscribeToTicketsByDepartment(
            department,
            (ticketsData) => {
                setTickets(ticketsData);
                setLoading(false);
            }
        );

        // Subscribe to teams for this department - auto-refresh
        const unsubscribeTeams = firebaseService.subscribeToTeamsByDepartment(
            department,
            (teamsData) => {
                setTeams(teamsData);
            }
        );

        return () => {
            unsubscribeTickets();
            unsubscribeTeams();
        };
    }, [department, isValidDepartment]);

    // Access control - redirect if not authorized
    React.useEffect(() => {
        if (!portalUser) {
            router.push('/portal-select');
            return;
        }

        // Super admin can access any department
        if (isSuperAdmin) return;

        // Department HQ can only access their own department
        if (portalUser.department !== department) {
            router.push(`/department/${portalUser.department}`);
        }
    }, [portalUser, isSuperAdmin, department, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/portal-select');
    };

    const handleViewTicket = (ticketId: string) => {
        router.push(`/tickets/${ticketId}`);
    };

    const handleMarkComplete = async (ticketId: string) => {
        try {
            await firebaseService.updateTicket(ticketId, { status: 'resolved' });
            toast.success('Ticket marked as complete!');
        } catch (error) {
            console.error('Failed to mark complete:', error);
            toast.error('Failed to mark ticket as complete');
        }
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

    // Calculate stats
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const assignedTickets = tickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const onlineTeams = teams.filter(t => t.status !== 'offline').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{DEPARTMENT_LABELS[department]} HQ</h1>
                        <p className="text-sm text-muted-foreground">
                            Department Dashboard • Real-time updates enabled
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-[var(--emerald-success)]/10 text-[var(--emerald-success)]">
                            <span className="w-2 h-2 rounded-full bg-[var(--emerald-success)] mr-2 animate-pulse" />
                            Live
                        </Badge>
                        <Button variant="outline" size="sm" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">New Assignments</p>
                                    <p className="text-3xl font-bold text-[var(--amber-warning)]">{openTickets}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--amber-warning)]/10">
                                    <Ticket className="h-6 w-6 text-[var(--amber-warning)]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">In Progress</p>
                                    <p className="text-3xl font-bold text-primary">{assignedTickets}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Resolved</p>
                                    <p className="text-3xl font-bold text-[var(--emerald-success)]">{resolvedTickets}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--emerald-success)]/10">
                                    <CheckCircle2 className="h-6 w-6 text-[var(--emerald-success)]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Teams Online</p>
                                    <p className="text-3xl font-bold">{onlineTeams}/{teams.length}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Assigned Tickets */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                Assigned Cases
                            </CardTitle>
                            <CardDescription>
                                Tickets assigned to your department by Super Admin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tickets.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No tickets assigned yet</p>
                                    <p className="text-sm">When Super Admin assigns tickets to your department, they'll appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">#{ticket.ticketNumber}</span>
                                                    <Badge variant={
                                                        ticket.status === 'resolved' ? 'default' :
                                                            ticket.status === 'in_progress' ? 'secondary' : 'outline'
                                                    }>
                                                        {ticket.status}
                                                    </Badge>
                                                    <Badge variant={
                                                        ticket.priority === 'critical' ? 'destructive' :
                                                            ticket.priority === 'high' ? 'destructive' : 'outline'
                                                    }>
                                                        {ticket.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {ticket.location.ward}
                                                    </span>
                                                    {ticket.assignedTeam && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {ticket.assignedTeam}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewTicket(ticket.id)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant={ticket.status === 'resolved' ? 'outline' : 'default'}
                                                    size="sm"
                                                    onClick={() => handleMarkComplete(ticket.id)}
                                                    disabled={ticket.status === 'resolved'}
                                                    className={ticket.status === 'resolved' ? '' : 'bg-[var(--emerald-success)] hover:bg-[var(--emerald-success)]/90'}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    {ticket.status === 'resolved' ? 'Completed' : 'Mark Complete'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teams */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Department Teams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {teams.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No teams found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teams.map((team) => (
                                        <div
                                            key={team.id}
                                            className="p-3 rounded-lg border"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{team.name}</span>
                                                <Badge
                                                    variant={team.status === 'available' ? 'default' : 'secondary'}
                                                    className={team.status === 'available' ? 'bg-[var(--emerald-success)]' : ''}
                                                >
                                                    {team.status}
                                                </Badge>
                                            </div>
                                            {team.currentTask && (
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {team.currentTask}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span>{team.members?.length || 0} members</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
