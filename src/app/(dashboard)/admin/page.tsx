"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Settings,
    Users,
    Shield,
    Bell,
    Database,
    Globe,
    UserPlus,
    Edit,
    Trash2,
    Building2,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/services/api";
import { Team, PortalUser, DEPARTMENT_LABELS, Department } from "@/lib/types";
import { toast } from "sonner";
import { AddTeamModal } from "@/components/admin/add-team-modal";
import { AddPortalUserModal } from "@/components/admin/add-portal-user-modal";
import { EditTeamModal } from "@/components/admin/edit-team-modal";

export default function AdminPage() {
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [portalUsers, setPortalUsers] = React.useState<PortalUser[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [clearingData, setClearingData] = React.useState(false);

    // UI State
    const [teamModalOpen, setTeamModalOpen] = React.useState(false);
    const [portalUserModalOpen, setPortalUserModalOpen] = React.useState(false);
    const [editTeamModalOpen, setEditTeamModalOpen] = React.useState(false);
    const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        loadData();
    }, []);

    const handleClearData = async () => {
        if (!confirm("Are you sure you want to delete ALL tickets, teams, users, and other seeded data from Firebase? This action cannot be undone.")) {
            return;
        }

        setClearingData(true);
        try {
            const response = await fetch('/api/admin/clear-data', { method: 'DELETE' });
            const data = await response.json();

            if (response.ok) {
                toast.success("Database cleared successfully");
                console.log("Deleted counts:", data.deletedCounts);
                loadData(); // Refresh the data
            } else {
                toast.error(data.error || "Failed to clear database");
            }
        } catch (error) {
            console.error("Error clearing data:", error);
            toast.error("Failed to clear database");
        } finally {
            setClearingData(false);
        }
    };

    const loadData = async () => {
        try {
            const [teamsData, portalUsersData] = await Promise.all([
                api.getTeams(),
                api.getPortalUsers()
            ]);
            setTeams(teamsData);
            setPortalUsers(portalUsersData);
        } catch (error) {
            console.error("Failed to load admin data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm("Are you sure you want to delete this team?")) return;

        try {
            setDeletingId(teamId);
            await api.deleteTeam(teamId);
            toast.success("Team deleted successfully");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete team");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeletePortalUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this portal user? This will also delete their Firebase Auth account.")) return;

        try {
            setDeletingId(userId);
            const response = await fetch(`/api/portal-users?id=${userId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            toast.success("Portal user deleted successfully");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete portal user");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditTeam = (team: Team) => {
        setSelectedTeam(team);
        setEditTeamModalOpen(true);
    };

    const departments = Object.entries(DEPARTMENT_LABELS) as [Department, string][];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
                <p className="text-muted-foreground">
                    System settings, user management, and configuration
                </p>
            </div>

            <Tabs defaultValue="portal-users">
                <TabsList>
                    <TabsTrigger value="portal-users" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Portal Users
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="gap-2">
                        <Users className="h-4 w-4" />
                        Teams
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Roles & Permissions
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        System Settings
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                </TabsList>


                {/* Portal Users Tab */}
                <TabsContent value="portal-users" className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Portal Users</h3>
                            <p className="text-sm text-muted-foreground">Super Admins and Department HQ accounts</p>
                        </div>
                        <Button onClick={() => setPortalUserModalOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Portal User
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">Loading portal users...</TableCell>
                                        </TableRow>
                                    ) : portalUsers.length === 0 ? (
                                        <TableRow key="empty">
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No portal users found. Click "Add Portal User" to create one.
                                            </TableCell>
                                        </TableRow>
                                    ) : portalUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {user.name?.split(" ").map(n => n[0]).join("") || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'super_admin' ? 'default' : 'outline'} className="capitalize">
                                                    {user.role === 'super_admin' ? 'Super Admin' : 'Department HQ'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.department ? DEPARTMENT_LABELS[user.department as Department] : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeletePortalUser(user.id)}
                                                    disabled={deletingId === user.id}
                                                >
                                                    {deletingId === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Teams Tab */}
                <TabsContent value="teams" className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Input placeholder="Search teams..." className="w-[300px]" />
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => setTeamModalOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Team
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <Card key={team.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {team.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        <Badge variant={team.status === 'available' ? 'default' : 'secondary'} className={team.status === 'available' ? 'bg-[var(--emerald-success)]' : ''}>
                                            {team.status}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTeam(team)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteTeam(team.id)}
                                            disabled={deletingId === team.id}
                                        >
                                            {deletingId === team.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{team.members?.length || 0} Members</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {team.department}
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        {(team.members || []).slice(0, 3).map((member: { id: string; name: string; role: string }) => (
                                            <div key={member.id} className="flex items-center text-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                                                {member.name} <span className="text-muted-foreground ml-1">({member.role})</span>
                                            </div>
                                        ))}
                                        {(team.members?.length || 0) > 3 && (
                                            <div className="text-xs text-muted-foreground pt-1">
                                                +{team.members.length - 3} more members
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles" className="mt-6 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4 text-[var(--signal-red)]" />
                                    Super Admin
                                </CardTitle>
                                <CardDescription>Full system access</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Manage all users and roles
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Access audit logs
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Configure system settings
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        All ticket operations
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">1 user with this role</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4 text-[var(--govt-blue)]" />
                                    Department HQ
                                </CardTitle>
                                <CardDescription>Department-level management</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        View department tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Manage department teams
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Assign teams to tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">✗</span>
                                        <span className="text-muted-foreground">Cross-department access</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">6 departments supported</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6 space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    General Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Organization Name</Label>
                                    <Input defaultValue="City Municipal Corporation" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time Zone</Label>
                                    <Select defaultValue="ist">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                                            <SelectItem value="utc">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Database Mode</Label>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="bg-[var(--emerald-success)]/10 text-[var(--emerald-success)] border-[var(--emerald-success)]/20">
                                            Production (Dynamic)
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">System is running in dynamic production mode.</p>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleClearData}
                                            disabled={clearingData}
                                        >
                                            {clearingData ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Clearing...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Clear All Seeded Data
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Removes all tickets, teams, users, and analytics from Firebase.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date Format</Label>
                                    <Select defaultValue="dmy">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                                            <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                                            <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    SLA Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Critical Priority SLA (hours)</Label>
                                    <Input type="number" defaultValue="4" />
                                </div>
                                <div className="space-y-2">
                                    <Label>High Priority SLA (hours)</Label>
                                    <Input type="number" defaultValue="8" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Medium Priority SLA (hours)</Label>
                                    <Input type="number" defaultValue="24" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Low Priority SLA (hours)</Label>
                                    <Input type="number" defaultValue="48" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">AI Auto-Assignment</p>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically assign tickets based on AI recommendations
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Duplicate Detection</p>
                                    <p className="text-sm text-muted-foreground">
                                        Flag and merge similar tickets automatically
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">SLA Breach Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Send alerts when tickets approach SLA deadline
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Citizen SMS Updates</p>
                                    <p className="text-sm text-muted-foreground">
                                        Send status updates to citizens via SMS
                                    </p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button>Save Settings</Button>
                    </div>
                </TabsContent >

                {/* Notifications Tab */}
                < TabsContent value="notifications" className="mt-6" >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Critical Ticket Alerts</p>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified for priority score 80+
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">SLA Warning (30 min before)</p>
                                    <p className="text-sm text-muted-foreground">
                                        Alert when approaching deadline
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Team Status Changes</p>
                                    <p className="text-sm text-muted-foreground">
                                        When teams go online/offline
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Daily Summary Email</p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive daily digest at 9:00 AM
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent >
            </Tabs>

            <AddTeamModal
                open={teamModalOpen}
                onOpenChange={setTeamModalOpen}
                onSuccess={loadData}
            />
            <AddPortalUserModal
                open={portalUserModalOpen}
                onOpenChange={setPortalUserModalOpen}
                onSuccess={loadData}
            />
            <EditTeamModal
                open={editTeamModalOpen}
                onOpenChange={setEditTeamModalOpen}
                team={selectedTeam}
                onSuccess={loadData}
            />
        </div>
    );
}
