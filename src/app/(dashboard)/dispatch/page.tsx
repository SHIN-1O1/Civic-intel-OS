"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Truck,
    Users,
    Clock,
    MapPin,
    GripVertical,
    RefreshCw,
    Zap,
    Building2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { api } from "@/services/api";
import { Team, Ticket, Department, DEPARTMENT_LABELS, CATEGORY_TO_DEPARTMENT } from "@/lib/types";
import { FirebaseService } from "@/services/firebase-service";

// Dynamically import map
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

// Department key to label mapping for teams
const DEPARTMENT_KEY_TO_LABEL: Record<Department, string> = {
    roads_infrastructure: 'Roads & Infrastructure',
    sanitation: 'Sanitation',
    electrical: 'Electrical',
    parks_gardens: 'Parks & Gardens',
    water_supply: 'Water Supply',
    drainage: 'Drainage'
};

// Get department from team's department string
function getDepartmentKeyFromLabel(label: string): Department | null {
    const mapping: Record<string, Department> = {
        'Roads & Infrastructure': 'roads_infrastructure',
        'Sanitation': 'sanitation',
        'Electrical': 'electrical',
        'Parks & Gardens': 'parks_gardens',
        'Water Supply': 'water_supply',
        'Drainage': 'drainage'
    };
    return mapping[label] || null;
}

export default function DispatchPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [mapReady, setMapReady] = React.useState(false);
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");

    // Assignment dialog state
    const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
    const [isAssigningSingle, setIsAssigningSingle] = React.useState(false);

    // Initialize Firebase Service
    const firebaseService = React.useMemo(() => new FirebaseService(), []);

    React.useEffect(() => {
        // Real-time subscriptions
        const unsubscribeTickets = firebaseService.subscribeToTickets((ticketsData) => {
            setTickets(ticketsData);
            setIsLoading(false);
        });

        // For teams, we still fetch all for Super Admin view
        api.getTeams()
            .then(teamsData => {
                setTeams(teamsData);
                setMapReady(true);
            })
            .catch(error => {
                console.error("Failed to fetch teams:", error);
                setTeams([]);
                setMapReady(true); // Allow UI to render even without teams
            });

        return () => {
            unsubscribeTickets();
        };
    }, [firebaseService]);

    const unassignedTickets = tickets.filter(t => !t.assignedTeam && t.status !== 'resolved');

    // Filter teams by department
    const filteredTeams = React.useMemo(() => {
        if (departmentFilter === "all") return teams;
        return teams.filter(t => {
            const deptKey = getDepartmentKeyFromLabel(t.department);
            return deptKey === departmentFilter;
        });
    }, [teams, departmentFilter]);

    const [isAssigning, setIsAssigning] = React.useState(false);

    // Smart auto-assign that matches category → department → team
    const handleAutoAssignAll = async () => {
        if (unassignedTickets.length === 0) {
            alert('No unassigned tickets to assign!');
            return;
        }

        setIsAssigning(true);
        let assignedCount = 0;

        for (const ticket of unassignedTickets) {
            // Determine department from ticket category
            const department = CATEGORY_TO_DEPARTMENT[ticket.category] ||
                CATEGORY_TO_DEPARTMENT[ticket.type] ||
                null;

            if (!department) {
                console.log(`No department mapping for category: ${ticket.category}`);
                continue;
            }

            const departmentLabel = DEPARTMENT_KEY_TO_LABEL[department];

            // Find available teams in the matching department
            const matchingTeams = teams.filter(t =>
                t.department === departmentLabel &&
                t.status === 'available' &&
                t.capacity.current < t.capacity.max
            );

            if (matchingTeams.length > 0) {
                try {
                    // Find best team (lowest current capacity)
                    const teamToAssign = matchingTeams.sort(
                        (a, b) => a.capacity.current - b.capacity.current
                    )[0];

                    await firebaseService.assignTicketToDepartment(
                        ticket.id,
                        teamToAssign.id,
                        teamToAssign.name
                    );
                    assignedCount++;
                } catch (error) {
                    console.error(`Failed to assign ticket ${ticket.id}`, error);
                }
            }
        }

        setIsAssigning(false);
        alert(`Successfully assigned ${assignedCount} out of ${unassignedTickets.length} tickets to respective departments!`);
    };

    // Open assignment dialog for single ticket
    const handleOpenAssignDialog = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setSelectedTeamId("");

        // Pre-select department filter based on ticket category
        const suggestedDept = CATEGORY_TO_DEPARTMENT[ticket.category] ||
            CATEGORY_TO_DEPARTMENT[ticket.type];
        if (suggestedDept) {
            setDepartmentFilter(suggestedDept);
        }

        setAssignDialogOpen(true);
    };

    // Assign single ticket to selected team
    const handleAssignSingle = async () => {
        if (!selectedTicket || !selectedTeamId) return;

        setIsAssigningSingle(true);
        try {
            const selectedTeam = teams.find(t => t.id === selectedTeamId);
            if (!selectedTeam) throw new Error("Team not found");

            await firebaseService.assignTicketToDepartment(
                selectedTicket.id,
                selectedTeam.id,
                selectedTeam.name
            );

            setAssignDialogOpen(false);
            setSelectedTicket(null);
            setSelectedTeamId("");
        } catch (error) {
            console.error("Failed to assign ticket:", error);
            alert("Failed to assign ticket. Please try again.");
        } finally {
            setIsAssigningSingle(false);
        }
    };

    // Get suggested department for a ticket
    const getSuggestedDepartment = (ticket: Ticket): Department | null => {
        return CATEGORY_TO_DEPARTMENT[ticket.category] ||
            CATEGORY_TO_DEPARTMENT[ticket.type] ||
            null;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available": return <Badge className="bg-[var(--emerald-success)]">Available</Badge>;
            case "busy": return <Badge variant="destructive">Busy</Badge>;
            case "offline": return <Badge variant="secondary">Offline</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getDepartmentBadgeColor = (department: string): string => {
        const colors: Record<string, string> = {
            'Roads & Infrastructure': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
            'Sanitation': 'bg-green-500/10 text-green-500 border-green-500/30',
            'Electrical': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
            'Parks & Gardens': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            'Water Supply': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
            'Drainage': 'bg-slate-500/10 text-slate-500 border-slate-500/30',
        };
        return colors[department] || 'bg-muted text-muted-foreground';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dispatch Center</h1>
                    <p className="text-muted-foreground">
                        Real-time workforce tracking and smart task assignment
                    </p>
                </div>
                <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Map View */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4 text-primary" />
                            Live Team Locations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 relative h-[500px]">
                        {isLoading ? (
                            <Skeleton className="absolute inset-0 m-4 rounded-lg" />
                        ) : (
                            <div className="absolute inset-0 m-4 rounded-lg overflow-hidden border border-border">
                                {mapReady && typeof window !== "undefined" && (
                                    <MapContainer
                                        center={[12.9716, 77.5946]}
                                        zoom={13}
                                        className="h-full w-full"
                                        zoomControl={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {filteredTeams.filter(t => t.location).map((team) => (
                                            <Marker
                                                key={team.id}
                                                position={[team.location!.lat, team.location!.lng]}
                                            >
                                                <Popup>
                                                    <div className="p-1">
                                                        <p className="font-semibold">{team.name}</p>
                                                        <p className="text-sm text-muted-foreground capitalize">
                                                            Status: {team.status}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {team.department}
                                                        </p>
                                                        {team.currentTask && (
                                                            <p className="text-xs mt-1">
                                                                Task: {team.currentTask}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                )}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="absolute bottom-6 left-6 z-[1000] rounded-lg bg-background/90 backdrop-blur p-3 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Team Status</p>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--emerald-success)]"></span>
                                    Available
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--signal-red)]"></span>
                                    Busy
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground"></span>
                                    Offline
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Roster */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Team Roster
                            </CardTitle>
                            <Badge variant="outline">
                                {filteredTeams.filter(t => t.status !== "offline").length}/{filteredTeams.length} Online
                            </Badge>
                        </div>
                        {/* Department Filter */}
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-full">
                                <Building2 className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {(Object.keys(DEPARTMENT_LABELS) as Department[]).map(dept => (
                                    <SelectItem key={dept} value={dept}>
                                        {DEPARTMENT_LABELS[dept]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-2 p-4 pt-0">
                                {filteredTeams.map((team) => (
                                    <div
                                        key={team.id}
                                        className={cn(
                                            "rounded-lg border p-4 transition-all",
                                            team.status === "available" && "border-[var(--emerald-success)]/30 bg-[var(--emerald-success)]/5 hover:bg-[var(--emerald-success)]/10",
                                            team.status === "busy" && "border-border",
                                            team.status === "offline" && "border-border opacity-50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{team.name}</span>
                                                </div>
                                                {/* Department Badge */}
                                                <Badge
                                                    variant="outline"
                                                    className={cn("mt-1 text-xs", getDepartmentBadgeColor(team.department))}
                                                >
                                                    {team.department}
                                                </Badge>
                                            </div>
                                            {getStatusBadge(team.status)}
                                        </div>

                                        {team.currentTask && (
                                            <div className="mb-3 rounded bg-muted/50 p-2 text-sm">
                                                <span className="text-muted-foreground">Task: </span>
                                                {team.currentTask}
                                                {team.currentTaskLocation && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        📍 {team.currentTaskLocation}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Shift ends
                                                </span>
                                                <span>{format(team.shiftEnd, "h:mm a")}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Capacity</span>
                                                    <span>{team.capacity.current}/{team.capacity.max} tasks</span>
                                                </div>
                                                <Progress
                                                    value={(team.capacity.current / team.capacity.max) * 100}
                                                    className="h-1.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Unassigned Queue */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GripVertical className="h-4 w-4" />
                                Unassigned Queue
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Click a ticket to assign to a specific team, or use smart auto-assign
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-[var(--amber-warning)]/10 text-[var(--amber-warning)] border-[var(--amber-warning)]">
                                {unassignedTickets.length} Pending
                            </Badge>
                            <Button
                                size="sm"
                                onClick={handleAutoAssignAll}
                                disabled={unassignedTickets.length === 0 || isAssigning}
                                className="bg-[var(--emerald-success)] hover:bg-[var(--emerald-success)]/90"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                {isAssigning ? 'Assigning...' : 'Smart Auto-Assign'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {unassignedTickets.map((ticket) => {
                            const suggestedDept = getSuggestedDepartment(ticket);
                            return (
                                <div
                                    key={ticket.id}
                                    className="flex-shrink-0 w-72 rounded-lg border border-border p-4 cursor-pointer hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                    onClick={() => handleOpenAssignDialog(ticket)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleOpenAssignDialog(ticket);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">#{ticket.ticketNumber}</span>
                                        <Badge variant="outline" className="text-xs">{ticket.type}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate mb-2">
                                        {ticket.location.ward}
                                    </p>

                                    {/* Suggested Department */}
                                    {suggestedDept && (
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs mb-2", getDepartmentBadgeColor(DEPARTMENT_LABELS[suggestedDept]))}
                                        >
                                            → {DEPARTMENT_LABELS[suggestedDept]}
                                        </Badge>
                                    )}

                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <span className={cn(
                                            "font-semibold",
                                            ticket.priorityScore >= 80 && "text-[var(--signal-red)]"
                                        )}>
                                            Score: {ticket.priorityScore}
                                        </span>
                                    </div>
                                    <div className="w-full mt-3 text-center text-xs text-primary font-medium">
                                        Click to assign →
                                    </div>
                                </div>

                            );
                        })}
                        {unassignedTickets.length === 0 && (
                            <div className="w-full text-center py-8 text-muted-foreground">
                                No unassigned tickets
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
                        <DialogDescription>
                            {selectedTicket?.type} - {selectedTicket?.category}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Ticket Info */}
                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                            <p className="font-medium">
                                {selectedTicket?.description
                                    ? selectedTicket.description.length > 100
                                        ? `${selectedTicket.description.slice(0, 100)}...`
                                        : selectedTicket.description
                                    : "No description"}
                            </p>
                            <p className="text-muted-foreground mt-1">📍 {selectedTicket?.location.ward}</p>
                        </div>

                        {/* Department Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {(Object.keys(DEPARTMENT_LABELS) as Department[]).map(dept => (
                                        <SelectItem key={dept} value={dept}>
                                            {DEPARTMENT_LABELS[dept]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Team Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assign to Team</label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTeams
                                        .filter(t => t.status === 'available' && t.capacity.current < t.capacity.max)
                                        .map(team => (
                                            <SelectItem key={team.id} value={team.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{team.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        ({team.capacity.current}/{team.capacity.max} tasks)
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {filteredTeams.filter(t => t.status === 'available' && t.capacity.current < t.capacity.max).length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No available teams in this department
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignSingle}
                            disabled={!selectedTeamId || isAssigningSingle}
                            className="bg-[var(--emerald-success)] hover:bg-[var(--emerald-success)]/90"
                        >
                            {isAssigningSingle ? 'Assigning...' : 'Assign Ticket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
