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
import { mockTickets } from "@/lib/mock-data";

export default function TicketsPage() {
    const [selectedTickets, setSelectedTickets] = React.useState<string[]>([]);
    const [showFilters, setShowFilters] = React.useState(true);

    const handleSelectTicket = (ticketId: string) => {
        setSelectedTickets((prev) =>
            prev.includes(ticketId)
                ? prev.filter((id) => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTickets.length === mockTickets.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(mockTickets.map((t) => t.id));
        }
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
                    <Button variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">
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
                        <Button variant="outline" size="sm">
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
            <TicketTable
                tickets={mockTickets}
                selectedTickets={selectedTickets}
                onSelectTicket={handleSelectTicket}
                onSelectAll={handleSelectAll}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{mockTickets.length}</span> of{" "}
                    <span className="font-medium">156</span> tickets
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
