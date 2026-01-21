// Core type definitions for Civic-intel-OS

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'on_site' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type SLAStage = 'on_track' | 'at_risk' | 'breached';
export type TeamStatus = 'available' | 'busy' | 'offline';
export type UserRole = 'super_admin' | 'ward_officer' | 'dispatcher' | 'field_team';

export interface Ticket {
    id: string;
    ticketNumber: number;
    type: string;
    category: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    priorityScore: number; // 0-100
    location: {
        ward: string;
        address: string;
        lat: number;
        lng: number;
    };
    reportCount: number; // Number of merged/duplicate reports
    slaDeadline: Date;
    slaStage: SLAStage;
    createdAt: Date;
    updatedAt: Date;
    assignedTeam?: string;
    assignedTeamId?: string;
    citizenName?: string;
    citizenPhone?: string;
    imageUrl?: string;
    audioNoteUrl?: string;
    aiAssessment?: {
        severity: string;
        reason: string;
        suggestedDepartment: string;
        suggestedSkill: string;
        estimatedTime: string;
    };
    activityLog: ActivityLogEntry[];
    internalNotes: InternalNote[];
}

export interface ActivityLogEntry {
    id: string;
    timestamp: Date;
    action: string;
    actor: string;
    actorRole: UserRole;
    details?: string;
}

export interface InternalNote {
    id: string;
    timestamp: Date;
    author: string;
    content: string;
}

export interface Team {
    id: string;
    name: string;
    department: string;
    status: TeamStatus;
    currentTask?: string;
    currentTaskLocation?: string;
    shiftEnd: Date;
    capacity: {
        current: number;
        max: number;
    };
    location?: {
        lat: number;
        lng: number;
    };
    members: TeamMember[];
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    phone: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    wardAssignment?: string;
    department?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLogin?: Date;
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    targetType: string;
    targetId: string;
    oldValue?: string;
    newValue?: string;
    ipAddress: string;
}

export interface KPIData {
    criticalLoad: number;
    criticalLoadTrend: number; // +/- from last hour
    slaBreaches: number;
    activeWorkforce: {
        online: number;
        total: number;
    };
    avgResponseTime: number; // in minutes
    avgResponseTrend: number; // +/- from yesterday
}

export interface WardStats {
    wardId: string;
    wardName: string;
    totalIssues: number;
    resolvedIssues: number;
    avgResolutionTime: number; // in hours
    slaComplianceRate: number; // percentage
}

export interface SystemFeedItem {
    id: string;
    timestamp: Date;
    type: 'auto_assign' | 'duplicate_flagged' | 'sla_warning' | 'escalation' | 'resolution';
    message: string;
    ticketId?: string;
}
