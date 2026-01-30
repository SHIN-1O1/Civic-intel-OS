"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TicketFiltersProps {
    onFilterChange?: (filters: Record<string, string>) => void;
}

const wards = [
    "All Wards",
    "Ward 1 - Downtown",
    "Ward 2 - Residential North",
    "Ward 3 - Green Belt",
    "Ward 4 - Central",
    "Ward 5 - Industrial",
    "Ward 6 - Commercial",
    "Ward 7 - Market District",
];

const departments = [
    "All Departments",
    "Roads & Infrastructure",
    "Sanitation",
    "Water Supply",
    "Electrical",
    "Drainage",
    "Parks & Gardens",
];

const statuses = [
    "All Status",
    "Open",
    "Assigned",
    "In Progress",
    "On Site",
    "Resolved",
    "Closed",
];

const slaStages = [
    "All SLA",
    "On Track",
    "At Risk",
    "Breached",
];

export function TicketFilters({ onFilterChange }: TicketFiltersProps) {
    const [ward, setWard] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [status, setStatus] = React.useState("");
    const [slaStage, setSlaStage] = React.useState("");
    const [dateFrom, setDateFrom] = React.useState("");
    const [dateTo, setDateTo] = React.useState("");

    const handleReset = () => {
        setWard("");
        setDepartment("");
        setStatus("");
        setSlaStage("");
        setDateFrom("");
        setDateTo("");
        // Also trigger filter change with empty values
        if (onFilterChange) {
            onFilterChange({});
        }
    };

    const handleApplyFilters = () => {
        if (onFilterChange) {
            onFilterChange({
                ward: ward || '',
                department: department || '',
                status: status || '',
                slaStage: slaStage || '',
                dateFrom: dateFrom || '',
                dateTo: dateTo || '',
            });
        }
    };

    return (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-card rounded-lg border border-border">
            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ward</Label>
                <Select value={ward} onValueChange={setWard}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Wards" />
                    </SelectTrigger>
                    <SelectContent>
                        {wards.map((w) => (
                            <SelectItem key={w} value={w.toLowerCase().replace(/\s/g, "-")}>
                                {w}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((d) => (
                            <SelectItem key={d} value={d.toLowerCase().replace(/\s/g, "-")}>
                                {d}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map((s) => (
                            <SelectItem key={s} value={s.toLowerCase().replace(/\s/g, "-")}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">SLA Stage</Label>
                <Select value={slaStage} onValueChange={setSlaStage}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All SLA" />
                    </SelectTrigger>
                    <SelectContent>
                        {slaStages.map((s) => (
                            <SelectItem key={s} value={s.toLowerCase().replace(/\s/g, "-")}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date Range</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-[140px]"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-[140px]"
                    />
                </div>
            </div>

            <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={handleReset}>
                    Reset
                </Button>
                <Button variant="default" onClick={handleApplyFilters}>
                    Apply Filters
                </Button>
            </div>
        </div>
    );
}
