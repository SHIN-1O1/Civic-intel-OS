"use client";

import * as React from "react";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Button } from "@/components/ui/button";
import {
    Download,
    Plus,
    UserPlus,
    RefreshCw,
    ListFilter
} from "lucide-react";
import { api } from "@/services/api";
import { Ticket } from "@/lib/types";
import { toast } from "sonner";

export default function TicketsPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [selectedTickets, setSelectedTickets] = React.useState<string[]>([]);
    const [showFilters, setShowFilters] = React.useState(true);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const data = await api.getTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = (ticketId: string) => {
        setSelectedTickets((prev) =>
            prev.includes(ticketId)
                ? prev.filter((id) => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTickets.length === tickets.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(tickets.map((t) => t.id));
        }
    };

    const handleExportCSV = (ticketsToExport: Ticket[]) => {
        if (ticketsToExport.length === 0) {
            toast.error("No tickets to export");
            return;
        }

        // CSV headers
        const headers = [
            "ID", "Type", "Category", "Status", "Priority", "Priority Score",
            "Location", "Ward", "Assigned Team", "SLA Deadline", "Created At", "Description"
        ];

        // Convert tickets to CSV rows
        const rows = ticketsToExport.map(ticket => [
            ticket.id,
            ticket.type || "",
            ticket.category || "",
            ticket.status || "",
            ticket.priority || "",
            ticket.priorityScore?.toString() || "",
            ticket.location?.address || "",
            ticket.location?.ward || "",
            ticket.assignedTeam || "Unassigned",
            ticket.slaDeadline ? new Date(ticket.slaDeadline).toISOString() : "",
            ticket.createdAt ? new Date(ticket.createdAt).toISOString() : "",
            `"${(ticket.description || "").replace(/"/g, '""')}"` // Escape quotes
        ]);

        // Build CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${ticketsToExport.length} tickets`);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ticket Grid</h1>
                    <p className="text-muted-foreground">
                        Manage and track all citizen complaints and service requests
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={loadTickets} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline" onClick={() => handleExportCSV(tickets)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Ticket
                    </Button>
                </div>
            </div>

            {/* Filters Toggle & Bulk Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? "bg-muted" : ""}
                >
                    <ListFilter className="h-4 w-4 mr-2" />
                    Filters
                </Button>

                {selectedTickets.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            {selectedTickets.length} selected
                        </span>
                        <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Batch Assign
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportCSV(tickets.filter(t => selectedTickets.includes(t.id)))}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Selected
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTickets([])}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            {showFilters && <TicketFilters />}

            {/* Data Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <TicketTable
                    tickets={tickets}
                    selectedTickets={selectedTickets}
                    onSelectTicket={handleSelectTicket}
                    onSelectAll={handleSelectAll}
                />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{tickets.length}</span> tickets
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
