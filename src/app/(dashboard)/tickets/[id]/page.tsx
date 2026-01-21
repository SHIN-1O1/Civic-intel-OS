"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    MapPin,
    Clock,
    Bot,
    FileText,
    CheckCircle,
    AlertTriangle,
    Copy,
    Play,
    User,
    Building,
    Wrench,
    Timer,
    Check,
    X,
    Edit,
    Volume2,
    Image as ImageIcon,
    Circle,
    Truck,
    Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTickets } from "@/lib/mock-data";
import { formatDistanceToNow, format } from "date-fns";

const statusSteps = [
    { key: "open", label: "Open", icon: Circle },
    { key: "assigned", label: "Assigned", icon: User },
    { key: "in_progress", label: "Dispatch", icon: Truck },
    { key: "on_site", label: "On Site", icon: MapPin },
    { key: "resolved", label: "Resolved", icon: Flag },
];

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params.id as string;

    // Find the ticket from mock data
    const ticket = mockTickets.find(t => t.id === ticketId) || mockTickets[0];

    const currentStepIndex = statusSteps.findIndex(s => s.key === ticket.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/tickets">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Ticket #{ticket.ticketNumber}
                            </h1>
                            <Badge variant="outline" className="text-sm">
                                {ticket.type}
                            </Badge>
                            {ticket.priorityScore >= 80 && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Critical
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                    </Button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Evidence & Origin */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" />
                            Evidence & Origin
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Photo */}
                        <div className="aspect-video rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                            {ticket.imageUrl ? (
                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                    <div className="text-center text-white/60">
                                        <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                                        <p className="text-sm">Citizen Photo</p>
                                        <p className="text-xs">Click to zoom</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-sm">No image</div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <MapPin className="h-4 w-4 text-primary" />
                                Location
                            </div>
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium">{ticket.location.ward}</p>
                                <p className="text-muted-foreground mt-1">{ticket.location.address}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {ticket.location.lat.toFixed(6)}, {ticket.location.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>

                        {/* Complaint Text */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Complaint Description</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {ticket.description}
                            </p>
                        </div>

                        {/* Audio Note */}
                        {ticket.audioNoteUrl && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Volume2 className="h-4 w-4" />
                                    Voice Note
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                    <Button size="icon" variant="secondary" className="h-8 w-8">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 h-1 bg-border rounded-full">
                                        <div className="w-1/3 h-full bg-primary rounded-full"></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">0:45</span>
                                </div>
                            </div>
                        )}

                        {/* Duplicate Indicator */}
                        {ticket.reportCount > 1 && (
                            <div className="rounded-lg border border-[var(--amber-warning)] bg-[var(--amber-warning)]/10 p-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-[var(--amber-warning)]">
                                    <Copy className="h-4 w-4" />
                                    Merged Reports ({ticket.reportCount})
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {ticket.reportCount - 1} similar reports within 50m radius
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Middle Column - AI & Operations */}
                <Card className="lg:col-span-1 border-primary/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bot className="h-4 w-4 text-primary" />
                            AI Assessment
                            <Badge variant="secondary" className="ml-auto text-xs">
                                Gemini
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* AI Assessment */}
                        {ticket.aiAssessment && (
                            <>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Severity</span>
                                        <Badge
                                            variant={ticket.aiAssessment.severity === "High" ? "destructive" : "secondary"}
                                        >
                                            {ticket.aiAssessment.severity}
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                                        <span className="text-muted-foreground">Reason: </span>
                                        {ticket.aiAssessment.reason}
                                    </div>
                                </div>

                                <Separator />

                                {/* Action Plan */}
                                <div className="space-y-3">
                                    <div className="text-sm font-medium">Recommended Action Plan</div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="text-xs text-muted-foreground">Department</div>
                                                <div className="text-sm font-medium">{ticket.aiAssessment.suggestedDepartment}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                            <Wrench className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="text-xs text-muted-foreground">Required Skill</div>
                                                <div className="text-sm font-medium">{ticket.aiAssessment.suggestedSkill}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                            <Timer className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <div className="text-xs text-muted-foreground">Estimated Time</div>
                                                <div className="text-sm font-medium">{ticket.aiAssessment.estimatedTime}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Approval Box */}
                                <div className="space-y-3">
                                    <div className="text-sm font-medium">Confirm AI Plan?</div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 gap-2">
                                            <Check className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button variant="outline" className="flex-1 gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit Plan
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column - Audit & Workflow */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-4 w-4" />
                            Audit & Workflow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Status Stepper */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Current Status</div>
                            <div className="space-y-0">
                                {statusSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isComplete = index < currentStepIndex;
                                    const isCurrent = index === currentStepIndex;

                                    return (
                                        <div key={step.key} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                                                    isComplete && "border-[var(--emerald-success)] bg-[var(--emerald-success)]",
                                                    isCurrent && "border-primary bg-primary",
                                                    !isComplete && !isCurrent && "border-muted bg-muted"
                                                )}>
                                                    {isComplete ? (
                                                        <Check className="h-4 w-4 text-white" />
                                                    ) : (
                                                        <Icon className={cn(
                                                            "h-4 w-4",
                                                            isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                                                        )} />
                                                    )}
                                                </div>
                                                {index < statusSteps.length - 1 && (
                                                    <div className={cn(
                                                        "w-0.5 h-6",
                                                        isComplete ? "bg-[var(--emerald-success)]" : "bg-muted"
                                                    )} />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "pt-1 text-sm",
                                                isCurrent && "font-medium",
                                                !isComplete && !isCurrent && "text-muted-foreground"
                                            )}>
                                                {step.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* SLA Monitor */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">SLA Monitor</div>
                            <div className={cn(
                                "rounded-lg p-4 text-center",
                                ticket.slaStage === "breached" && "bg-[var(--signal-red)]/10 border border-[var(--signal-red)]",
                                ticket.slaStage === "at_risk" && "bg-[var(--amber-warning)]/10 border border-[var(--amber-warning)]",
                                ticket.slaStage === "on_track" && "bg-[var(--emerald-success)]/10 border border-[var(--emerald-success)]"
                            )}>
                                <div className={cn(
                                    "text-2xl font-bold font-mono",
                                    ticket.slaStage === "breached" && "text-[var(--signal-red)]",
                                    ticket.slaStage === "at_risk" && "text-[var(--amber-warning)]",
                                    ticket.slaStage === "on_track" && "text-[var(--emerald-success)]"
                                )}>
                                    {formatDistanceToNow(ticket.slaDeadline)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date() > ticket.slaDeadline ? "Overdue" : "Until deadline"}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Internal Notes */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Internal Notes</div>
                            <Textarea
                                placeholder="Add a private note (not visible to citizens)..."
                                className="min-h-[80px] resize-none"
                            />
                            <Button size="sm" className="w-full">Add Note</Button>

                            {ticket.internalNotes.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {ticket.internalNotes.map((note) => (
                                        <div key={note.id} className="rounded-lg bg-muted p-3 text-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{note.author}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(note.timestamp, "MMM d, h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Activity Log */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Activity Log</div>
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-3 pr-4">
                                    {ticket.activityLog.map((entry) => (
                                        <div key={entry.id} className="flex gap-3 text-sm">
                                            <div className="text-xs text-muted-foreground whitespace-nowrap w-16">
                                                {format(entry.timestamp, "h:mm a")}
                                            </div>
                                            <div>
                                                <p>{entry.action}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    — {entry.actor}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
