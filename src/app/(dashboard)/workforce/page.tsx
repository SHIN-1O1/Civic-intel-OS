"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Users,
    UserPlus,
    Clock,
    Truck,
    Calendar,
    Phone,
    Mail,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { api } from "@/services/api";
import { Team, User } from "@/lib/types";

export default function WorkforcePage() {
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teamsData, usersData] = await Promise.all([
                api.getTeams(),
                api.getUsers()
            ]);
            setTeams(teamsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load workforce data", error);
        } finally {
            setLoading(false);
        }
    };

    const onlineTeams = teams.filter(t => t.status !== "offline").length;
    const busyTeams = teams.filter(t => t.status === "busy").length;
    const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0);

    if (loading) {
        return <div className="p-8 text-center">Loading workforce data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workforce Management</h1>
                    <p className="text-muted-foreground">
                        Team rosters, shifts, and personnel overview
                    </p>
                </div>
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Team Member
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Truck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{teams.length}</p>
                                <p className="text-sm text-muted-foreground">Total Teams</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[var(--emerald-success)]/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-[var(--emerald-success)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{onlineTeams}</p>
                                <p className="text-sm text-muted-foreground">Teams Online</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[var(--signal-red)]/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-[var(--signal-red)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{busyTeams}</p>
                                <p className="text-sm text-muted-foreground">Currently Busy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[var(--govt-blue)]/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-[var(--govt-blue)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalMembers}</p>
                                <p className="text-sm text-muted-foreground">Total Personnel</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Teams and Personnel */}
            <Tabs defaultValue="teams">
                <TabsList>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="personnel">Personnel</TabsTrigger>
                    <TabsTrigger value="shifts">Shift Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="teams" className="mt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <Card key={team.id} className={cn(
                                team.status === "offline" && "opacity-60"
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{team.name}</CardTitle>
                                        <Badge
                                            variant={team.status === "available" ? "default" : team.status === "busy" ? "destructive" : "secondary"}
                                            className={team.status === "available" ? "bg-[var(--emerald-success)]" : ""}
                                        >
                                            {team.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{team.department}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {team.currentTask && (
                                        <div className="rounded-lg bg-muted p-3 text-sm">
                                            <p className="font-medium">Current Task</p>
                                            <p className="text-muted-foreground">{team.currentTask}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span>{team.capacity.current}/{team.capacity.max}</span>
                                        </div>
                                        <Progress value={(team.capacity.current / team.capacity.max) * 100} />
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shift ends</span>
                                        <span>{format(team.shiftEnd, "h:mm a")}</span>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <p className="text-sm font-medium mb-2">Members ({team.members.length})</p>
                                        <div className="flex -space-x-2">
                                            {team.members.slice(0, 4).map((member) => (
                                                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                                    <AvatarFallback className="text-xs">
                                                        {member.name.split(" ").map(n => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {team.members.length > 4 && (
                                                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                                    +{team.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="personnel" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.flatMap(team =>
                                        team.members.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>
                                                                {member.name.split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{member.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{team.name}</TableCell>
                                                <TableCell>{member.role}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        {member.phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shifts" className="mt-4">
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Shift Schedule Coming Soon</p>
                            <p className="text-sm">Weekly shift planning and roster management</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
