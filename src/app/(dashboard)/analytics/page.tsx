"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    BarChart3,
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    AlertTriangle,
    Users
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { api } from "@/services/api";
import { Ticket, WardStats, KPIData } from "@/lib/types";

// Helper to escape HTML special characters (prevents XSS)
const escapeHtml = (unsafe: string | number): string => {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Helper to escape CSV values (prevents CSV injection)
const escapeCSV = (value: string | number): string => {
    const str = String(value);
    // Escape formula injection and wrap in quotes if contains special chars
    if (/^[=+\-@\t\r]/.test(str) || /[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export default function AnalyticsPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [wardStats, setWardStats] = React.useState<WardStats[]>([]);
    const [kpiData, setKPIData] = React.useState<KPIData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ticketsData, wardsData, kpiInfo] = await Promise.all([
                api.getTickets(),
                api.getWardStats(),
                api.getKPIData()
            ]);
            setTickets(ticketsData);
            setWardStats(wardsData);
            setKPIData(kpiInfo);
        } catch (error) {
            console.error("Failed to load analytics data", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics from real data
    const totalResolved = tickets.filter(t => t.status === 'resolved').length;
    const avgResolutionTime = kpiData?.avgResolutionTime || 0;
    const slaCompliance = kpiData?.slaComplianceRate || 0;

    // Calculate monthly data from real tickets
    const monthlyData = React.useMemo(() => {
        // Group tickets by month
        const monthMap = new Map<string, { issues: number; resolved: number }>();

        tickets.forEach(ticket => {
            const date = new Date(ticket.createdAt);
            const monthKey = date.toLocaleString('en-US', { month: 'short' });

            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, { issues: 0, resolved: 0 });
            }

            const data = monthMap.get(monthKey)!;
            data.issues++;
            if (ticket.status === 'resolved') {
                data.resolved++;
            }
        });

        // Get last 6 months
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = month.toLocaleString('en-US', { month: 'short' });
            months.push({
                month: monthKey,
                issues: monthMap.get(monthKey)?.issues || 0,
                resolved: monthMap.get(monthKey)?.resolved || 0
            });
        }

        return months;
    }, [tickets]);

    //Calculate category data from real tickets
    const categoryData = React.useMemo(() => {
        const categories: Record<string, number> = {};
        tickets.forEach(ticket => {
            categories[ticket.category] = (categories[ticket.category] || 0) + 1;
        });

        const total = tickets.length || 1;
        const colors = {
            "Roads & Infrastructure": "#ef4444",
            "Sanitation": "#f59e0b",
            "Water Supply": "#3b82f6",
            "Electrical": "#8b5cf6",
            "Public Safety": "#10b981"
        };

        return Object.entries(categories).map(([name, count]) => ({
            name,
            value: Math.round((count / total) * 100),
            color: colors[name as keyof typeof colors] || "#6b7280"
        }));
    }, [tickets]);

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground">
                        SLA compliance, impact metrics, and performance insights
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        // Export CSV with proper escaping
                        const csvData = [
                            ['Metric', 'Value'],
                            ['Total Tickets', escapeCSV(tickets.length)],
                            ['Total Resolved', escapeCSV(totalResolved)],
                            ['Avg Resolution Time (hours)', escapeCSV(avgResolutionTime)],
                            ['SLA Compliance (%)', escapeCSV(slaCompliance)],
                            ['Critical Load', escapeCSV(kpiData?.criticalLoad || 0)],
                            ['SLA Breaches', escapeCSV(kpiData?.slaBreaches || 0)],
                            ['', ''],
                            ['Ward', 'Total Issues', 'Resolved', 'SLA %'],
                            ...wardStats.map(w => [escapeCSV(w.wardName), escapeCSV(w.totalIssues), escapeCSV(w.resolvedIssues), escapeCSV(w.slaComplianceRate)])
                        ];
                        const csv = csvData.map(row => row.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={() => {
                        // Generate PDF-like report (HTML print dialog) with XSS protection
                        const reportWindow = window.open('', '_blank');
                        if (reportWindow) {
                            reportWindow.document.write(`
                                <html>
                                <head>
                                    <title>Monthly Analytics Report - ${escapeHtml(new Date().toLocaleDateString())}</title>
                                    <style>
                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                        h1 { color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                        th { background-color: #4f46e5; color: white; }
                                        .metric { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
                                        .metric-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
                                    </style>
                                </head>
                                <body>
                                    <h1>Civic Intelligence OS - Monthly Analytics Report</h1>
                                    <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
                                    
                                    <h2>Key Performance Indicators</h2>
                                    <div class="metric">
                                        <strong>Total Tickets:</strong> <span class="metric-value">${escapeHtml(tickets.length)}</span>
                                    </div>
                                    <div class="metric">
                                        <strong>Total Resolved:</strong> <span class="metric-value">${escapeHtml(totalResolved)}</span>
                                    </div>
                                    <div class="metric">
                                        <strong>Average Resolution Time:</strong> <span class="metric-value">${escapeHtml(avgResolutionTime)}h</span>
                                    </div>
                                    <div class="metric">
                                        <strong>SLA Compliance:</strong> <span class="metric-value">${escapeHtml(slaCompliance)}%</span>
                                    </div>
                                    
                                    <h2>Ward Performance</h2>
                                    <table>
                                        <tr>
                                            <th>Ward</th>
                                            <th>Total Issues</th>
                                            <th>Resolved</th>
                                            <th>Avg Resolution (h)</th>
                                            <th>SLA Compliance</th>
                                        </tr>
                                        ${wardStats.map(w => `
                                            <tr>
                                                <td>${escapeHtml(w.wardName)}</td>
                                                <td>${escapeHtml(w.totalIssues)}</td>
                                                <td>${escapeHtml(w.resolvedIssues)}</td>
                                                <td>${escapeHtml(w.avgResolutionTime)}</td>
                                                <td>${escapeHtml(w.slaComplianceRate)}%</td>
                                            </tr>
                                        `).join('')}
                                    </table>
                                </body>
                                </html>
                            `);
                            reportWindow.document.close();
                            setTimeout(() => reportWindow.print(), 250);
                        }
                    }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Monthly PDF
                    </Button>
                </div>
            </div>

            {/* Impact Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-[var(--emerald-success)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Issues Fixed</p>
                                <p className="text-3xl font-bold mt-1">{totalResolved}</p>
                                <div className="flex items-center gap-1 text-sm text-[var(--emerald-success)] mt-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>From Firebase</span>
                                </div>
                            </div>
                            <CheckCircle className="h-10 w-10 text-[var(--emerald-success)] opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                                <p className="text-3xl font-bold mt-1">{avgResolutionTime.toFixed(1)}h</p>
                                <div className="flex items-center gap-1 text-sm text-[var(--emerald-success)] mt-1">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>Improving</span>
                                </div>
                            </div>
                            <Clock className="h-10 w-10 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                                <p className="text-3xl font-bold mt-1">{slaCompliance.toFixed(1)}%</p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <span>Real-time data</span>
                                </div>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-[var(--amber-warning)] opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-primary">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Tickets</p>
                                <p className="text-3xl font-bold mt-1">{tickets.length}</p>
                                <p className="text-sm text-muted-foreground mt-1">Active in system</p>
                            </div>
                            <Users className="h-10 w-10 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Monthly Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Monthly Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="issues" name="Reported" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Issue Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issue Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}%`}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-muted-foreground">No category data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ward Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Ward Performance Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    {wardStats.length > 0 ? (
                        <div className="space-y-4">
                            {wardStats
                                .sort((a, b) => b.slaComplianceRate - a.slaComplianceRate)
                                .map((ward, index) => (
                                    <div key={ward.wardId} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{ward.wardName}</span>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-muted-foreground">
                                                        {ward.resolvedIssues}/{ward.totalIssues} resolved
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        Avg: {ward.avgResolutionTime}h
                                                    </span>
                                                    <Badge
                                                        variant={ward.slaComplianceRate >= 95 ? "default" : ward.slaComplianceRate >= 90 ? "secondary" : "destructive"}
                                                        className={ward.slaComplianceRate >= 95 ? "bg-[var(--emerald-success)]" : ""}
                                                    >
                                                        {ward.slaComplianceRate}% SLA
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Progress value={ward.slaComplianceRate} className="h-2" />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No ward statistics available</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
