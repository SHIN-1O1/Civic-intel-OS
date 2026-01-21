import { KPICard } from "@/components/dashboard/kpi-card";
import { ActionStream } from "@/components/dashboard/action-stream";
import { Heatmap } from "@/components/dashboard/heatmap";
import {
    AlertTriangle,
    Clock,
    Users,
    Timer
} from "lucide-react";
import {
    mockKPIData,
    getUrgentTickets,
    mockSystemFeed
} from "@/lib/mock-data";

export default function DashboardPage() {
    const urgentTickets = getUrgentTickets();

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
                    value={mockKPIData.criticalLoad}
                    trend={mockKPIData.criticalLoadTrend}
                    trendLabel="from last hour"
                    variant="critical"
                    pulse={true}
                    icon={<AlertTriangle className="h-6 w-6 text-[var(--signal-red)]" />}
                />
                <KPICard
                    title="SLA Breaches"
                    value={mockKPIData.slaBreaches}
                    subtitle="Today"
                    variant="warning"
                    icon={<Clock className="h-6 w-6 text-[var(--amber-warning)]" />}
                />
                <KPICard
                    title="Active Workforce"
                    value={`${mockKPIData.activeWorkforce.online}/${mockKPIData.activeWorkforce.total}`}
                    subtitle="Teams Online"
                    variant="success"
                    icon={<Users className="h-6 w-6 text-[var(--emerald-success)]" />}
                />
                <KPICard
                    title="Avg Response"
                    value={`${mockKPIData.avgResponseTime} min`}
                    trend={mockKPIData.avgResponseTrend}
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
                        systemFeed={mockSystemFeed}
                    />
                </div>
            </div>
        </div>
    );
}
