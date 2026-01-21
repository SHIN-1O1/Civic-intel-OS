"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Truck,
    Users,
    Clock,
    MapPin,
    Phone,
    GripVertical,
    Plus,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTeams, getUnassignedTickets } from "@/lib/mock-data";
import { format } from "date-fns";

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

export default function DispatchPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [mapReady, setMapReady] = React.useState(false);
    const unassignedTickets = getUnassignedTickets();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            setMapReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available": return "bg-[var(--emerald-success)]";
            case "busy": return "bg-[var(--signal-red)]";
            case "offline": return "bg-muted-foreground";
            default: return "bg-muted-foreground";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available": return <Badge className="bg-[var(--emerald-success)]">Available</Badge>;
            case "busy": return <Badge variant="destructive">Busy</Badge>;
            case "offline": return <Badge variant="secondary">Offline</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dispatch Center</h1>
                    <p className="text-muted-foreground">
                        Real-time workforce tracking and task assignment
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
                                        {mockTeams.filter(t => t.location).map((team) => (
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Team Roster
                            </CardTitle>
                            <Badge variant="outline">
                                {mockTeams.filter(t => t.status !== "offline").length}/{mockTeams.length} Online
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[450px]">
                            <div className="space-y-2 p-4 pt-0">
                                {mockTeams.map((team) => (
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
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {team.department}
                                                </p>
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
                        <CardTitle className="flex items-center gap-2 text-base">
                            <GripVertical className="h-4 w-4" />
                            Unassigned Queue
                        </CardTitle>
                        <Badge variant="outline" className="bg-[var(--amber-warning)]/10 text-[var(--amber-warning)] border-[var(--amber-warning)]">
                            {unassignedTickets.length} Pending
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Drag tickets to team cards above to assign, or click to auto-assign
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {unassignedTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="flex-shrink-0 w-64 rounded-lg border border-border p-4 cursor-grab hover:border-primary transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">#{ticket.ticketNumber}</span>
                                    <Badge variant="outline" className="text-xs">{ticket.type}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {ticket.location.ward}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <span className={cn(
                                        "font-semibold",
                                        ticket.priorityScore >= 80 && "text-[var(--signal-red)]"
                                    )}>
                                        Score: {ticket.priorityScore}
                                    </span>
                                </div>
                                <Button size="sm" className="w-full mt-3">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Assign
                                </Button>
                            </div>
                        ))}
                        {unassignedTickets.length === 0 && (
                            <div className="w-full text-center py-8 text-muted-foreground">
                                No unassigned tickets
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
