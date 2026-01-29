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
import { Team, TeamMember, DEPARTMENT_LABELS, Department } from "@/lib/types";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface EditTeamModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    onSuccess: () => void;
}

export function EditTeamModal({ open, onOpenChange, team, onSuccess }: EditTeamModalProps) {
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: "",
        department: "" as Department | "",
        maxCapacity: "10",
        members: [] as TeamMember[]
    });
    const [newMember, setNewMember] = React.useState({
        name: "",
        role: "",
        phone: ""
    });

    // Initialize form data when team changes
    React.useEffect(() => {
        if (team) {
            // Find department key from label
            const deptEntry = Object.entries(DEPARTMENT_LABELS).find(
                ([_, label]) => label === team.department
            );

            setFormData({
                name: team.name,
                department: (deptEntry?.[0] as Department) || "",
                maxCapacity: String(team.capacity?.max || 10),
                members: team.members || []
            });
        }
    }, [team]);

    const handleAddMember = () => {
        if (!newMember.name || !newMember.role) {
            toast.error("Member name and role are required");
            return;
        }

        const member: TeamMember = {
            id: `member-${Date.now()}`,
            ...newMember
        };

        setFormData({
            ...formData,
            members: [...formData.members, member]
        });
        setNewMember({ name: "", role: "", phone: "" });
    };

    const handleRemoveMember = (memberId: string) => {
        setFormData({
            ...formData,
            members: formData.members.filter(m => m.id !== memberId)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!team || !formData.name || !formData.department) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);

            await api.updateTeam(team.id, {
                name: formData.name,
                department: DEPARTMENT_LABELS[formData.department as Department],
                capacity: {
                    current: team.capacity?.current || 0,
                    max: parseInt(formData.maxCapacity)
                },
                members: formData.members
            });

            toast.success("Team updated successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update team");
        } finally {
            setLoading(false);
        }
    };

    const departments = Object.entries(DEPARTMENT_LABELS) as [Department, string][];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                    <DialogDescription>
                        Update team details and manage team members.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Electrical Unit A"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select
                            value={formData.department}
                            onValueChange={(value: Department) =>
                                setFormData({ ...formData, department: value })
                            }
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

                    {/* Team Members Section */}
                    <div className="space-y-3 border-t pt-4">
                        <Label>Team Members ({formData.members.length})</Label>

                        {/* Existing Members */}
                        {formData.members.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {formData.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.role}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveMember(member.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Member */}
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                placeholder="Name"
                                value={newMember.name}
                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            />
                            <Input
                                placeholder="Role"
                                value={newMember.role}
                                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Phone"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddMember}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
