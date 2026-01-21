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
    MoreHorizontal,
    Edit,
    Trash2,
    Key
} from "lucide-react";
import { mockUsers } from "@/lib/mock-data";
import { format } from "date-fns";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
                <p className="text-muted-foreground">
                    System settings, user management, and configuration
                </p>
            </div>

            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" />
                        Users
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

                {/* Users Tab */}
                <TabsContent value="users" className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Input placeholder="Search users..." className="w-[300px]" />
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="ward_officer">Ward Officer</SelectItem>
                                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Assignment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {user.name.split(" ").map(n => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role.replace(/_/g, " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.wardAssignment || user.department || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.isActive ? "default" : "secondary"}
                                                    className={user.isActive ? "bg-[var(--emerald-success)]" : ""}
                                                >
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.lastLogin ? format(user.lastLogin, "MMM d, h:mm a") : "Never"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
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
                                    Ward Officer
                                </CardTitle>
                                <CardDescription>Ward-level management</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        View assigned ward tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Update ticket status
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Add internal notes
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">✗</span>
                                        <span className="text-muted-foreground">System configuration</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">3 users with this role</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4 text-[var(--amber-warning)]" />
                                    Dispatcher
                                </CardTitle>
                                <CardDescription>Team coordination</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        View all tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Assign teams to tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--emerald-success)]">✓</span>
                                        Manage dispatch queue
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">✗</span>
                                        <span className="text-muted-foreground">Delete tickets</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">1 user with this role</p>
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
                                    <Label>Default Timezone</Label>
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
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-6">
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
