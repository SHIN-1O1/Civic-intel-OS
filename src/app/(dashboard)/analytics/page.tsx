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
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { mockWardStats } from "@/lib/mock-data";

const monthlyData = [
    { month: "Jul", issues: 890, resolved: 845 },
    { month: "Aug", issues: 956, resolved: 920 },
    { month: "Sep", issues: 1024, resolved: 998 },
    { month: "Oct", issues: 1156, resolved: 1089 },
    { month: "Nov", issues: 1089, resolved: 1045 },
    { month: "Dec", issues: 1240, resolved: 1195 },
];

const categoryData = [
    { name: "Roads", value: 35, color: "#ef4444" },
    { name: "Sanitation", value: 25, color: "#f59e0b" },
    { name: "Water", value: 18, color: "#3b82f6" },
    { name: "Electrical", value: 12, color: "#8b5cf6" },
    { name: "Others", value: 10, color: "#6b7280" },
];

export default function AnalyticsPage() {
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
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button>
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
                                <p className="text-3xl font-bold mt-1">1,240</p>
                                <div className="flex items-center gap-1 text-sm text-[var(--emerald-success)] mt-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>+12% vs last month</span>
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
                                <p className="text-3xl font-bold mt-1">18.5h</p>
                                <div className="flex items-center gap-1 text-sm text-[var(--emerald-success)] mt-1">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>-2.3h improvement</span>
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
                                <p className="text-3xl font-bold mt-1">94.2%</p>
                                <div className="flex items-center gap-1 text-sm text-[var(--amber-warning)] mt-1">
                                    <TrendingDown className="h-4 w-4" />
                                    <span>-1.1% vs target</span>
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
                                <p className="text-sm text-muted-foreground">Man-hours Saved by AI</p>
                                <p className="text-3xl font-bold mt-1">450+</p>
                                <p className="text-sm text-muted-foreground mt-1">This month</p>
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
                    <div className="space-y-4">
                        {mockWardStats
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
                </CardContent>
            </Card>
        </div>
    );
}
