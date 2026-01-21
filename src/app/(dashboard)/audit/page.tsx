"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
    ScrollText,
    Search,
    Download,
    Filter,
    Eye,
    Edit,
    UserPlus,
    Trash2,
    ShieldCheck
} from "lucide-react";
import { mockAuditLogs } from "@/lib/mock-data";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
    VIEW: "bg-muted text-muted-foreground",
    ASSIGN: "bg-[var(--govt-blue)]/10 text-[var(--govt-blue)] border-[var(--govt-blue)]",
    UPDATE_STATUS: "bg-[var(--amber-warning)]/10 text-[var(--amber-warning)] border-[var(--amber-warning)]",
    ADD_NOTE: "bg-primary/10 text-primary border-primary",
    RESOLVE: "bg-[var(--emerald-success)]/10 text-[var(--emerald-success)] border-[var(--emerald-success)]",
    CREATE: "bg-[var(--emerald-success)]/10 text-[var(--emerald-success)] border-[var(--emerald-success)]",
    DELETE: "bg-[var(--signal-red)]/10 text-[var(--signal-red)] border-[var(--signal-red)]",
};

const actionIcons: Record<string, React.ReactNode> = {
    VIEW: <Eye className="h-3 w-3" />,
    ASSIGN: <UserPlus className="h-3 w-3" />,
    UPDATE_STATUS: <Edit className="h-3 w-3" />,
    ADD_NOTE: <Edit className="h-3 w-3" />,
    RESOLVE: <ShieldCheck className="h-3 w-3" />,
    CREATE: <UserPlus className="h-3 w-3" />,
    DELETE: <Trash2 className="h-3 w-3" />,
};

export default function AuditPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [actionFilter, setActionFilter] = React.useState("all");

    const filteredLogs = mockAuditLogs.filter(log => {
        const matchesSearch =
            log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.targetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAction = actionFilter === "all" || log.action === actionFilter;

        return matchesSearch && matchesAction;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Complete activity trail for compliance and accountability
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                </Button>
            </div>

            {/* Compliance Notice */}
            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">Audit Trail Enabled</p>
                            <p className="text-sm text-muted-foreground">
                                All user actions are logged and retained for 7 years as per government compliance requirements.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by user, action, or target..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="VIEW">View</SelectItem>
                                <SelectItem value="ASSIGN">Assign</SelectItem>
                                <SelectItem value="UPDATE_STATUS">Update Status</SelectItem>
                                <SelectItem value="ADD_NOTE">Add Note</SelectItem>
                                <SelectItem value="RESOLVE">Resolve</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" className="w-[160px]" />
                        <span className="self-center text-muted-foreground">to</span>
                        <Input type="date" className="w-[160px]" />
                    </div>
                </CardContent>
            </Card>

            {/* Audit Table */}
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5" />
                        Activity Log
                        <Badge variant="outline" className="ml-2">
                            {filteredLogs.length} records
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[150px]">User</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                                <TableHead className="w-[100px]">Target Type</TableHead>
                                <TableHead className="w-[100px]">Target ID</TableHead>
                                <TableHead>Old Value</TableHead>
                                <TableHead>New Value</TableHead>
                                <TableHead className="w-[130px]">IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id} className="font-mono text-sm">
                                    <TableCell className="text-muted-foreground">
                                        {format(log.timestamp, "MMM d, yyyy HH:mm:ss")}
                                    </TableCell>
                                    <TableCell className="font-sans font-medium">
                                        {log.userName}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`gap-1 ${actionColors[log.action] || ""}`}
                                        >
                                            {actionIcons[log.action]}
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {log.targetType}
                                    </TableCell>
                                    <TableCell className="text-primary">
                                        {log.targetId}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[150px] truncate">
                                        {log.oldValue || "—"}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">
                                        {log.newValue || "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {log.ipAddress}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{filteredLogs.length}</span> of{" "}
                    <span className="font-medium">2,450</span> log entries
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                        1
                    </Button>
                    <Button variant="outline" size="sm">
                        2
                    </Button>
                    <Button variant="outline" size="sm">
                        3
                    </Button>
                    <Button variant="outline" size="sm">
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
