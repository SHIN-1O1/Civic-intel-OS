"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    Clock,
    MapPin,
    Phone,
    ArrowLeft,
    Truck,
    CheckCircle2,
    XCircle,
    Edit
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Department, DEPARTMENT_LABELS, Team } from "@/lib/types";
import { FirebaseService } from "@/services/firebase-service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EditTeamModal } from "@/components/admin/edit-team-modal";

const firebaseService = new FirebaseService();

export default function DepartmentTeamsPage() {
    const params = useParams();
    const router = useRouter();
    const { portalUser, isSuperAdmin } = useAuth();
    const department = params.dept as Department;

    const [teams, setTeams] = React.useState<Team[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [editTeamModalOpen, setEditTeamModalOpen] = React.useState(false);
    const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);

    const handleEditTeam = (team: Team) => {
        setSelectedTeam(team);
        setEditTeamModalOpen(true);
    };

    const handleEditSuccess = () => {
        // Teams will refresh via real-time subscription
    };

    // Validate department
    const isValidDepartment = department && DEPARTMENT_LABELS[department];

    // Real-time subscriptions
    React.useEffect(() => {
        if (!isValidDepartment) return;

        setLoading(true);
        const unsubscribe = firebaseService.subscribeToTeamsByDepartment(
            department,
            (teamsData) => {
                setTeams(teamsData);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available":
                return <Badge className="bg-[var(--emerald-success)]">Available</Badge>;
            case "busy":
                return <Badge variant="destructive">Busy</Badge>;
            case "offline":
                return <Badge variant="secondary">Offline</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Calculate stats
    const onlineTeams = teams.filter(t => t.status !== 'offline').length;
    const availableTeams = teams.filter(t => t.status === 'available').length;
    const busyTeams = teams.filter(t => t.status === 'busy').length;
    const totalCapacity = teams.reduce((acc, t) => acc + t.capacity.max, 0);
    const usedCapacity = teams.reduce((acc, t) => acc + t.capacity.current, 0);

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
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
                        {DEPARTMENT_LABELS[department]} - Teams
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage your department's field teams
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--emerald-success)]/10">
                            <CheckCircle2 className="h-5 w-5 text-[var(--emerald-success)]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{availableTeams}</p>
                            <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                            <Truck className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{busyTeams}</p>
                            <p className="text-xs text-muted-foreground">Busy</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{teams.length - onlineTeams}</p>
                            <p className="text-xs text-muted-foreground">Offline</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">Workload</p>
                            <p className="text-xs font-medium">{usedCapacity}/{totalCapacity}</p>
                        </div>
                        <Progress value={totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0} className="h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No teams found in this department</p>
                        </CardContent>
                    </Card>
                ) : (
                    teams.map((team) => (
                        <Card
                            key={team.id}
                            className={cn(
                                "transition-all",
                                team.status === "available" && "border-[var(--emerald-success)]/30",
                                team.status === "offline" && "opacity-60"
                            )}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            team.status === "available" && "bg-[var(--emerald-success)]/10",
                                            team.status === "busy" && "bg-destructive/10",
                                            team.status === "offline" && "bg-muted"
                                        )}>
                                            <Truck className={cn(
                                                "h-5 w-5",
                                                team.status === "available" && "text-[var(--emerald-success)]",
                                                team.status === "busy" && "text-destructive",
                                                team.status === "offline" && "text-muted-foreground"
                                            )} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{team.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                {team.members?.length || 0} members
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(team.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Task */}
                                {team.currentTask ? (
                                    <div className="rounded-lg bg-muted/50 p-3">
                                        <p className="text-sm font-medium mb-1">Current Task</p>
                                        <p className="text-sm text-muted-foreground">{team.currentTask}</p>
                                        {team.currentTaskLocation && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {team.currentTaskLocation}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                                        <p className="text-sm text-muted-foreground">No active task</p>
                                    </div>
                                )}

                                {/* Capacity */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Task Capacity</span>
                                        <span className="font-medium">{team.capacity.current}/{team.capacity.max}</span>
                                    </div>
                                    <Progress
                                        value={(team.capacity.current / team.capacity.max) * 100}
                                        className="h-2"
                                    />
                                </div>

                                {/* Shift End */}
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        Shift ends
                                    </span>
                                    <span>{format(new Date(team.shiftEnd), 'h:mm a')}</span>
                                </div>

                                {/* Team Members */}
                                {team.members && team.members.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs font-medium mb-2">Team Members</p>
                                        <div className="space-y-2">
                                            {team.members.slice(0, 3).map((member) => (
                                                <div key={member.id} className="flex items-center justify-between text-xs">
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-muted-foreground">{member.role}</p>
                                                    </div>
                                                    <a
                                                        href={`tel:${member.phone}`}
                                                        className="text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Phone className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            ))}
                                            {team.members.length > 3 && (
                                                <p className="text-xs text-muted-foreground">
                                                    +{team.members.length - 3} more members
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Edit Button */}
                                <div className="pt-3 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleEditTeam(team)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Manage Team
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Team Modal */}
            <EditTeamModal
                open={editTeamModalOpen}
                onOpenChange={setEditTeamModalOpen}
                team={selectedTeam}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
