"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Brain,
    AlertTriangle,
    MapPin,
    Calendar,
    TrendingUp,
    RefreshCw,
    Shield,
    Clock,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { predictiveService } from "@/services/predictive-service";
import { api } from "@/services/api";
import { PredictiveAlert, DEPARTMENT_LABELS, Department } from "@/lib/types";

export default function PredictivePage() {
    const [alerts, setAlerts] = React.useState<PredictiveAlert[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [analyzing, setAnalyzing] = React.useState(false);

    React.useEffect(() => {
        analyzePatterns();
    }, []);

    const analyzePatterns = async () => {
        setLoading(true);
        try {
            const tickets = await api.getTickets();
            const predictedAlerts = await predictiveService.generatePredictiveAlerts(tickets);
            setAlerts(predictedAlerts);
        } catch (error) {
            console.error("Failed to generate predictions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReanalyze = async () => {
        setAnalyzing(true);
        await analyzePatterns();
        setAnalyzing(false);
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "critical": return "bg-red-500/10 text-red-500 border-red-500/30";
            case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
            case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
            case "low": return "bg-green-500/10 text-green-500 border-green-500/30";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getRiskBarColor = (score: number) => {
        if (score >= 75) return "bg-red-500";
        if (score >= 50) return "bg-orange-500";
        if (score >= 25) return "bg-yellow-500";
        return "bg-green-500";
    };

    // Summary stats
    const criticalCount = alerts.filter(a => a.riskLevel === "critical").length;
    const highCount = alerts.filter(a => a.riskLevel === "high").length;
    const overdueCount = alerts.filter(a => a.predictedDate <= new Date()).length;
    const avgRisk = alerts.length > 0
        ? Math.round(alerts.reduce((sum, a) => sum + a.riskScore, 0) / alerts.length)
        : 0;

    // Group by department
    const deptGroups = React.useMemo(() => {
        const groups: Record<string, PredictiveAlert[]> = {};
        alerts.forEach(alert => {
            const dept = alert.department || "unknown";
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(alert);
        });
        return groups;
    }, [alerts]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Brain className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Analyzing historical patterns with AI...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Brain className="h-7 w-7 text-primary" />
                        Predictive Maintenance
                    </h1>
                    <p className="text-muted-foreground">
                        AI-powered failure prediction based on historical ticket patterns
                    </p>
                </div>
                <Button onClick={handleReanalyze} disabled={analyzing}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", analyzing && "animate-spin")} />
                    {analyzing ? "Analyzing..." : "Re-analyze"}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-red-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Critical Risks</p>
                                <p className="text-3xl font-bold mt-1 text-red-500">{criticalCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Immediate attention needed</p>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-red-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">High Risk Areas</p>
                                <p className="text-3xl font-bold mt-1 text-orange-500">{highCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Schedule maintenance soon</p>
                            </div>
                            <Shield className="h-10 w-10 text-orange-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Overdue Predictions</p>
                                <p className="text-3xl font-bold mt-1 text-yellow-500">{overdueCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Past predicted failure date</p>
                            </div>
                            <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                                <p className="text-3xl font-bold mt-1">{avgRisk}</p>
                                <p className="text-xs text-muted-foreground mt-1">Across {alerts.length} patterns</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Risk Alerts List */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-4 w-4 text-primary" />
                            Predicted Failures
                            <Badge variant="outline">{alerts.length} patterns</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-3 p-4 pt-0">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "rounded-lg border p-4 transition-all hover:shadow-md",
                                            alert.riskLevel === "critical" && "border-red-500/30 bg-red-500/5",
                                            alert.riskLevel === "high" && "border-orange-500/30 bg-orange-500/5",
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{alert.location.ward}</span>
                                                    <Badge variant="outline" className={cn("text-xs", getRiskColor(alert.riskLevel))}>
                                                        {alert.riskLevel.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground ml-6">{alert.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{alert.riskScore}</p>
                                                <p className="text-xs text-muted-foreground">Risk Score</p>
                                            </div>
                                        </div>

                                        {/* Risk bar */}
                                        <div className="mb-3">
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", getRiskBarColor(alert.riskScore))}
                                                    style={{ width: `${alert.riskScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        <p className="text-sm mb-2">{alert.recommendation}</p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Predicted: {format(alert.predictedDate, "MMM d, yyyy")}
                                            </span>
                                            <span>{alert.recurrenceCount} past incidents</span>
                                            <Badge variant="outline" className="text-xs">
                                                {DEPARTMENT_LABELS[alert.department as Department] || alert.department}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {alerts.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>No recurring patterns detected yet.</p>
                                        <p className="text-sm">More ticket data is needed for predictions.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Department Breakdown */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Risk by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(deptGroups).map(([dept, deptAlerts]) => {
                                const avgScore = Math.round(
                                    deptAlerts.reduce((sum, a) => sum + a.riskScore, 0) / deptAlerts.length
                                );
                                return (
                                    <div key={dept} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {DEPARTMENT_LABELS[dept as Department] || dept}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {deptAlerts.length} alerts • Avg: {avgScore}
                                            </span>
                                        </div>
                                        <Progress
                                            value={avgScore}
                                            className="h-2"
                                        />
                                        <div className="flex gap-1">
                                            {deptAlerts
                                                .sort((a, b) => b.riskScore - a.riskScore)
                                                .slice(0, 3)
                                                .map(a => (
                                                    <Badge
                                                        key={a.id}
                                                        variant="outline"
                                                        className={cn("text-xs", getRiskColor(a.riskLevel))}
                                                    >
                                                        {a.location.ward}
                                                    </Badge>
                                                ))
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(deptGroups).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No department data available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
