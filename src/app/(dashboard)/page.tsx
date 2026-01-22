"use client";

import * as React from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ActionStream } from "@/components/dashboard/action-stream";
import { Heatmap } from "@/components/dashboard/heatmap";
import {
    AlertTriangle,
    Clock,
    Users,
    Timer
} from "lucide-react";
import { api } from "@/services/api";
import { KPIData, Ticket, SystemFeedItem } from "@/lib/types";

export default function DashboardPage() {
    const [kpiData, setKpiData] = React.useState<KPIData | null>(null);
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [systemFeed, setSystemFeed] = React.useState<SystemFeedItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [kpi, tix, feed] = await Promise.all([
                api.getKPIData(),
                api.getTickets(),
                api.getSystemFeed()
            ]);
            setKpiData(kpi);
            setTickets(tix);
            setSystemFeed(feed);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const urgentTickets = tickets.filter(t => t.priorityScore > 75 && t.status !== 'resolved').slice(0, 5);

    if (loading || !kpiData) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
                <p className="text-muted-foreground">
                    Real-time operational overview and situational awareness
                </p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Critical Load"
                    value={kpiData.criticalLoad}
                    trend={kpiData.criticalLoadTrend}
                    trendLabel="from last hour"
                    variant="critical"
                    pulse={true}
                    icon={<AlertTriangle className="h-6 w-6 text-[var(--signal-red)]" />}
                />
                <KPICard
                    title="SLA Breaches"
                    value={kpiData.slaBreaches}
                    subtitle="Today"
                    variant="warning"
                    icon={<Clock className="h-6 w-6 text-[var(--amber-warning)]" />}
                />
                <KPICard
                    title="Active Workforce"
                    value={`${kpiData.activeWorkforce.online}/${kpiData.activeWorkforce.total}`}
                    subtitle="Teams Online"
                    variant="success"
                    icon={<Users className="h-6 w-6 text-[var(--emerald-success)]" />}
                />
                <KPICard
                    title="Avg Response"
                    value={`${kpiData.avgResponseTime} min`}
                    trend={kpiData.avgResponseTrend}
                    trendLabel="vs yesterday response time"
                    variant="default"
                    icon={<Timer className="h-6 w-6 text-primary" />}
                />
            </div>

            {/* Main Content - Heatmap + Action Stream */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Heatmap - Takes 2/3 of the space */}
                <div className="lg:col-span-2">
                    <Heatmap />
                </div>

                {/* Action Stream - Takes 1/3 of the space */}
                <div className="lg:col-span-1">
                    <ActionStream
                        urgentTickets={urgentTickets}
                        systemFeed={systemFeed}
                    />
                </div>
            </div>
        </div>
    );
}
