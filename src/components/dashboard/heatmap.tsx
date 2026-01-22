"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MapPin,
    Maximize2,
    RefreshCw
} from "lucide-react";
import { api } from "@/services/api";
import { Ticket } from "@/lib/types";

// Dynamically import to avoid SSR issues
const TicketsMap = dynamic(
    () => import("@/components/maps/tickets-map").then((mod) => mod.TicketsMap),
    {
        ssr: false,
        loading: () => <Skeleton className="w-full h-full min-h-[400px]" />
    }
);

export function Heatmap() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const loadTickets = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets for map", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Live Ticket Map
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={loadTickets}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : `${tickets.length} active tickets`}
                </p>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[400px]">
                {isLoading ? (
                    <Skeleton className="absolute inset-0 m-4 rounded-lg" />
                ) : (
                    <div className="absolute inset-0 m-4">
                        <TicketsMap tickets={tickets} />
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-6 left-6 z-[1000] rounded-lg bg-background/90 backdrop-blur p-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Priority Level</p>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
                            Low/Medium
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
                            High/At Risk
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span>
                            Critical/Breached
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
