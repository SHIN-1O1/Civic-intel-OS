// Core type definitions for Civic-intel-OS

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'on_site' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type SLAStage = 'on_track' | 'at_risk' | 'breached';
export type TeamStatus = 'available' | 'busy' | 'offline';
export type UserRole = 'super_admin' | 'department_hq';

// Department Portal System
export type Department =
    | 'roads_infrastructure'
    | 'sanitation'
    | 'electrical'
    | 'parks_gardens'
    | 'water_supply'
    | 'drainage';

export type PortalRole = 'super_admin' | 'department_hq';

export interface PortalUser {
    id: string;
    name: string;
    role: PortalRole;
    department?: Department;
}

// Input type for creating new portal users
export interface CreatePortalUserInput {
    name: string;
    email: string;
    password: string;
    role: PortalRole;
    department?: Department;
}

// System configuration for dynamic settings
export interface SystemConfig {
    departments: DepartmentConfig[];
}

export interface DepartmentConfig {
    key: Department;
    label: string;
    isActive: boolean;
}

// Department display names and mappings
export const DEPARTMENT_LABELS: Record<Department, string> = {
    roads_infrastructure: 'Roads & Infrastructure',
    sanitation: 'Sanitation',
    electrical: 'Electrical',
    parks_gardens: 'Parks & Gardens',
    water_supply: 'Water Supply',
    drainage: 'Drainage'
};

export const CATEGORY_TO_DEPARTMENT: Record<string, Department> = {
    'Roads & Infrastructure': 'roads_infrastructure',
    'Road Issues': 'roads_infrastructure',
    'Pothole': 'roads_infrastructure',
    'Sanitation': 'sanitation',
    'Garbage Pile': 'sanitation',
    'Healthcare': 'sanitation',
    'Electrical': 'electrical',
    'Street Light': 'electrical',
    'Parks & Gardens': 'parks_gardens',
    'Tree Fall': 'parks_gardens',
    'Water Supply': 'water_supply',
    'Water Leak': 'water_supply',
    'Drainage': 'drainage',
    'Drainage Block': 'drainage'
};

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
    assignedDepartment?: Department;
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
    avgResolutionTime?: number; // in hours
    slaComplianceRate?: number; // percentage
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

// Citizen Report interface (from public-facing app)
export interface CitizenReport {
    id: string;
    userId: string;
    category: string;
    description: string;
    summary: string;
    location: string; // Full address string
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Pending' | 'In Progress' | 'Resolved';
    timestamp: Date;
    date: string; // Formatted date string
    hasImage: boolean;
    imageUrl?: string;
    aiVerified: boolean;
}
