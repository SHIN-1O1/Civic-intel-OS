"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { toast } from "sonner";
import { DEPARTMENT_LABELS, Department } from "@/lib/types";

interface AddTeamModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddTeamModal({ open, onOpenChange, onSuccess }: AddTeamModalProps) {
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        department: "",
        maxCapacity: "10"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.department) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            await api.createTeam({
                name: formData.name,
                department: DEPARTMENT_LABELS[formData.department as Department] || formData.department,
                maxCapacity: parseInt(formData.maxCapacity)
            });
            toast.success("Team created successfully");
            onSuccess();
            onOpenChange(false);
            setFormData({ name: "", department: "", maxCapacity: "10" });
        } catch (error) {
            console.error(error);
            toast.error("Failed to create team");
        } finally {
            setLoading(false);
        }
    };

    // Dynamic departments from DEPARTMENT_LABELS
    const departments = Object.entries(DEPARTMENT_LABELS) as [Department, string][];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Team</DialogTitle>
                    <DialogDescription>
                        Create a new field team for a specific department.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Electrical Unit A"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                            value={formData.department}
                            onValueChange={(value) => setFormData({ ...formData, department: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity">Max Capacity (Daily Tickets)</Label>
                        <Input
                            id="capacity"
                            type="number"
                            value={formData.maxCapacity}
                            onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                            min="1"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Team"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

