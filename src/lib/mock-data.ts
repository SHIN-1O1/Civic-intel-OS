import {
    Ticket, Team, User, AuditLog, KPIData, WardStats, SystemFeedItem
} from './types';

// Generate realistic dates
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000);

// Mock KPI Data
export const mockKPIData: KPIData = {
    criticalLoad: 12,
    criticalLoadTrend: 2,
    slaBreaches: 3,
    activeWorkforce: {
        online: 8,
        total: 12
    },
    avgResponseTime: 42,
    avgResponseTrend: -8
};

// Mock Tickets
export const mockTickets: Ticket[] = [
    {
        id: 'TKT-1024',
        ticketNumber: 1024,
        type: 'Pothole',
        category: 'Roads & Infrastructure',
        description: 'Large pothole near school entrance causing traffic hazard. Multiple vehicles damaged.',
        status: 'open',
        priority: 'critical',
        priorityScore: 92,
        location: {
            ward: 'Ward 4 - Central',
            address: '123 Main Street, Near City Public School',
            lat: 12.9716,
            lng: 77.5946
        },
        reportCount: 4,
        slaDeadline: hoursFromNow(4),
        slaStage: 'at_risk',
        createdAt: hoursAgo(6),
        updatedAt: hoursAgo(1),
        imageUrl: '/api/placeholder/400/300',
        aiAssessment: {
            severity: 'High',
            reason: 'Blocking school entrance, safety hazard for children',
            suggestedDepartment: 'Roads Department',
            suggestedSkill: 'Heavy Equipment',
            estimatedTime: '2 hours'
        },
        activityLog: [
            { id: '1', timestamp: hoursAgo(6), action: 'Ticket created from citizen report', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: hoursAgo(6), action: 'AI prioritization applied (Score: 92)', actor: 'Gemini AI', actorRole: 'super_admin' },
            { id: '3', timestamp: hoursAgo(4), action: '3 duplicate reports merged', actor: 'System', actorRole: 'super_admin' },
            { id: '4', timestamp: hoursAgo(1), action: 'Viewed by Officer', actor: 'Officer Sharma', actorRole: 'ward_officer' }
        ],
        internalNotes: [
            { id: '1', timestamp: hoursAgo(1), author: 'Officer Sharma', content: 'Confirmed severity. Needs immediate attention before school hours tomorrow.' }
        ]
    },
    {
        id: 'TKT-1023',
        ticketNumber: 1023,
        type: 'Garbage Pile',
        category: 'Sanitation',
        description: 'Overflowing garbage bins at market area. Strong odor affecting nearby shops.',
        status: 'assigned',
        priority: 'high',
        priorityScore: 78,
        location: {
            ward: 'Ward 7 - Market District',
            address: '45 Market Road, Fish Market Area',
            lat: 12.9766,
            lng: 77.5993
        },
        reportCount: 2,
        slaDeadline: hoursFromNow(6),
        slaStage: 'on_track',
        createdAt: hoursAgo(8),
        updatedAt: hoursAgo(2),
        assignedTeam: 'Sanitation Team B',
        assignedTeamId: 'TEAM-002',
        aiAssessment: {
            severity: 'High',
            reason: 'Public health concern in commercial area',
            suggestedDepartment: 'Sanitation',
            suggestedSkill: 'Heavy Lifting',
            estimatedTime: '1.5 hours'
        },
        activityLog: [
            { id: '1', timestamp: hoursAgo(8), action: 'Ticket created', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: hoursAgo(2), action: 'Assigned to Sanitation Team B', actor: 'Dispatcher Kumar', actorRole: 'dispatcher' }
        ],
        internalNotes: []
    },
    {
        id: 'TKT-1022',
        ticketNumber: 1022,
        type: 'Street Light',
        category: 'Electrical',
        description: 'Multiple street lights not working on residential street. Safety concern at night.',
        status: 'in_progress',
        priority: 'medium',
        priorityScore: 65,
        location: {
            ward: 'Ward 2 - Residential North',
            address: '78 Oak Avenue, Block C',
            lat: 12.9650,
            lng: 77.5850
        },
        reportCount: 1,
        slaDeadline: hoursFromNow(12),
        slaStage: 'on_track',
        createdAt: hoursAgo(24),
        updatedAt: hoursAgo(3),
        assignedTeam: 'Electrical Team A',
        assignedTeamId: 'TEAM-003',
        activityLog: [
            { id: '1', timestamp: hoursAgo(24), action: 'Ticket created', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: hoursAgo(12), action: 'Assigned to Electrical Team A', actor: 'System', actorRole: 'super_admin' },
            { id: '3', timestamp: hoursAgo(3), action: 'Team dispatched to location', actor: 'Dispatcher Kumar', actorRole: 'dispatcher' }
        ],
        internalNotes: []
    },
    {
        id: 'TKT-1021',
        ticketNumber: 1021,
        type: 'Water Leak',
        category: 'Water Supply',
        description: 'Major water main leak causing road flooding and water wastage.',
        status: 'on_site',
        priority: 'critical',
        priorityScore: 95,
        location: {
            ward: 'Ward 5 - Industrial',
            address: '200 Industrial Estate Road',
            lat: 12.9800,
            lng: 77.6100
        },
        reportCount: 6,
        slaDeadline: hoursFromNow(2),
        slaStage: 'at_risk',
        createdAt: hoursAgo(10),
        updatedAt: hoursAgo(0.5),
        assignedTeam: 'Water Team A',
        assignedTeamId: 'TEAM-004',
        activityLog: [
            { id: '1', timestamp: hoursAgo(10), action: 'Emergency ticket created', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: hoursAgo(8), action: 'Escalated to critical', actor: 'System', actorRole: 'super_admin' },
            { id: '3', timestamp: hoursAgo(4), action: 'Water Team A assigned', actor: 'Dispatcher Kumar', actorRole: 'dispatcher' },
            { id: '4', timestamp: hoursAgo(0.5), action: 'Team arrived on site', actor: 'Water Team A', actorRole: 'field_team' }
        ],
        internalNotes: [
            { id: '1', timestamp: hoursAgo(4), author: 'Dispatcher Kumar', content: 'Coordinating with traffic police for road closure.' }
        ]
    },
    {
        id: 'TKT-1020',
        ticketNumber: 1020,
        type: 'Tree Fall',
        category: 'Parks & Gardens',
        description: 'Fallen tree blocking footpath in public park.',
        status: 'resolved',
        priority: 'medium',
        priorityScore: 55,
        location: {
            ward: 'Ward 3 - Green Belt',
            address: 'Central Park, North Entrance',
            lat: 12.9700,
            lng: 77.5900
        },
        reportCount: 1,
        slaDeadline: daysAgo(1),
        slaStage: 'on_track',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
        assignedTeam: 'Parks Team C',
        assignedTeamId: 'TEAM-005',
        activityLog: [
            { id: '1', timestamp: daysAgo(2), action: 'Ticket created', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: daysAgo(1.5), action: 'Assigned to Parks Team C', actor: 'System', actorRole: 'super_admin' },
            { id: '3', timestamp: daysAgo(1), action: 'Issue resolved - tree removed', actor: 'Parks Team C', actorRole: 'field_team' }
        ],
        internalNotes: []
    },
    {
        id: 'TKT-1019',
        ticketNumber: 1019,
        type: 'Drainage Block',
        category: 'Drainage',
        description: 'Blocked storm drain causing water logging during rains.',
        status: 'open',
        priority: 'high',
        priorityScore: 72,
        location: {
            ward: 'Ward 6 - Commercial',
            address: '88 Business Park Road',
            lat: 12.9750,
            lng: 77.6050
        },
        reportCount: 3,
        slaDeadline: hoursFromNow(8),
        slaStage: 'on_track',
        createdAt: hoursAgo(16),
        updatedAt: hoursAgo(4),
        activityLog: [
            { id: '1', timestamp: hoursAgo(16), action: 'Ticket created', actor: 'System', actorRole: 'super_admin' },
            { id: '2', timestamp: hoursAgo(12), action: '2 duplicate reports merged', actor: 'System', actorRole: 'super_admin' }
        ],
        internalNotes: []
    }
];

// Mock Teams
export const mockTeams: Team[] = [
    {
        id: 'TEAM-001',
        name: 'Road Team A',
        department: 'Roads & Infrastructure',
        status: 'busy',
        currentTask: 'Fixing Pothole',
        currentTaskLocation: 'Main St & 5th Ave',
        shiftEnd: hoursFromNow(4),
        capacity: { current: 2, max: 4 },
        location: { lat: 12.9720, lng: 77.5950 },
        members: [
            { id: 'M001', name: 'Rajesh Kumar', role: 'Team Lead', phone: '+91 98765 43210' },
            { id: 'M002', name: 'Suresh Patel', role: 'Operator', phone: '+91 98765 43211' }
        ]
    },
    {
        id: 'TEAM-002',
        name: 'Sanitation Team B',
        department: 'Sanitation',
        status: 'busy',
        currentTask: 'Garbage Collection',
        currentTaskLocation: 'Market Road',
        shiftEnd: hoursFromNow(3),
        capacity: { current: 3, max: 5 },
        location: { lat: 12.9768, lng: 77.5995 },
        members: [
            { id: 'M003', name: 'Venkat Rao', role: 'Team Lead', phone: '+91 98765 43212' },
            { id: 'M004', name: 'Mohan Das', role: 'Worker', phone: '+91 98765 43213' },
            { id: 'M005', name: 'Sita Devi', role: 'Worker', phone: '+91 98765 43214' }
        ]
    },
    {
        id: 'TEAM-003',
        name: 'Electrical Team A',
        department: 'Electrical',
        status: 'busy',
        currentTask: 'Street Light Repair',
        currentTaskLocation: 'Oak Avenue',
        shiftEnd: hoursFromNow(5),
        capacity: { current: 1, max: 3 },
        location: { lat: 12.9652, lng: 77.5852 },
        members: [
            { id: 'M006', name: 'Anil Sharma', role: 'Electrician Lead', phone: '+91 98765 43215' }
        ]
    },
    {
        id: 'TEAM-004',
        name: 'Water Team A',
        department: 'Water Supply',
        status: 'busy',
        currentTask: 'Water Main Repair',
        currentTaskLocation: 'Industrial Estate',
        shiftEnd: hoursFromNow(6),
        capacity: { current: 4, max: 4 },
        location: { lat: 12.9802, lng: 77.6102 },
        members: [
            { id: 'M007', name: 'Prakash Nair', role: 'Team Lead', phone: '+91 98765 43216' },
            { id: 'M008', name: 'Ganesh Iyer', role: 'Plumber', phone: '+91 98765 43217' },
            { id: 'M009', name: 'Ramesh Singh', role: 'Plumber', phone: '+91 98765 43218' },
            { id: 'M010', name: 'Kiran Kumar', role: 'Helper', phone: '+91 98765 43219' }
        ]
    },
    {
        id: 'TEAM-005',
        name: 'Parks Team C',
        department: 'Parks & Gardens',
        status: 'available',
        shiftEnd: hoursFromNow(4),
        capacity: { current: 0, max: 3 },
        location: { lat: 12.9702, lng: 77.5902 },
        members: [
            { id: 'M011', name: 'Lakshmi Bai', role: 'Team Lead', phone: '+91 98765 43220' },
            { id: 'M012', name: 'Arjun Reddy', role: 'Gardener', phone: '+91 98765 43221' }
        ]
    },
    {
        id: 'TEAM-006',
        name: 'Road Team B',
        department: 'Roads & Infrastructure',
        status: 'available',
        shiftEnd: hoursFromNow(5),
        capacity: { current: 0, max: 4 },
        location: { lat: 12.9680, lng: 77.5920 },
        members: [
            { id: 'M013', name: 'Deepak Verma', role: 'Team Lead', phone: '+91 98765 43222' },
            { id: 'M014', name: 'Santosh Gupta', role: 'Operator', phone: '+91 98765 43223' }
        ]
    },
    {
        id: 'TEAM-007',
        name: 'Drainage Team A',
        department: 'Drainage',
        status: 'offline',
        shiftEnd: hoursAgo(2),
        capacity: { current: 0, max: 4 },
        members: [
            { id: 'M015', name: 'Ravi Shankar', role: 'Team Lead', phone: '+91 98765 43224' }
        ]
    },
    {
        id: 'TEAM-008',
        name: 'Electrical Team B',
        department: 'Electrical',
        status: 'offline',
        shiftEnd: hoursAgo(1),
        capacity: { current: 0, max: 3 },
        members: [
            { id: 'M016', name: 'Vijay Kumar', role: 'Electrician Lead', phone: '+91 98765 43225' }
        ]
    }
];

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'USR-001',
        name: 'Administrator',
        email: 'admin@civic.gov.in',
        role: 'super_admin',
        isActive: true,
        lastLogin: hoursAgo(1),
        avatarUrl: undefined
    },
    {
        id: 'USR-002',
        name: 'Officer Sharma',
        email: 'sharma@civic.gov.in',
        role: 'ward_officer',
        wardAssignment: 'Ward 4 - Central',
        isActive: true,
        lastLogin: hoursAgo(2)
    },
    {
        id: 'USR-003',
        name: 'Dispatcher Kumar',
        email: 'kumar@civic.gov.in',
        role: 'dispatcher',
        department: 'Operations',
        isActive: true,
        lastLogin: hoursAgo(0.5)
    },
    {
        id: 'USR-004',
        name: 'Officer Patel',
        email: 'patel@civic.gov.in',
        role: 'ward_officer',
        wardAssignment: 'Ward 7 - Market District',
        isActive: true,
        lastLogin: hoursAgo(4)
    },
    {
        id: 'USR-005',
        name: 'Officer Reddy',
        email: 'reddy@civic.gov.in',
        role: 'ward_officer',
        wardAssignment: 'Ward 2 - Residential North',
        isActive: false,
        lastLogin: daysAgo(7)
    }
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
    {
        id: 'AUD-001',
        timestamp: hoursAgo(1),
        userId: 'USR-002',
        userName: 'Officer Sharma',
        action: 'VIEW',
        targetType: 'Ticket',
        targetId: 'TKT-1024',
        ipAddress: '192.168.1.45'
    },
    {
        id: 'AUD-002',
        timestamp: hoursAgo(2),
        userId: 'USR-003',
        userName: 'Dispatcher Kumar',
        action: 'ASSIGN',
        targetType: 'Ticket',
        targetId: 'TKT-1023',
        oldValue: 'Unassigned',
        newValue: 'Sanitation Team B',
        ipAddress: '192.168.1.32'
    },
    {
        id: 'AUD-003',
        timestamp: hoursAgo(4),
        userId: 'USR-003',
        userName: 'Dispatcher Kumar',
        action: 'ADD_NOTE',
        targetType: 'Ticket',
        targetId: 'TKT-1021',
        newValue: 'Coordinating with traffic police for road closure.',
        ipAddress: '192.168.1.32'
    },
    {
        id: 'AUD-004',
        timestamp: hoursAgo(6),
        userId: 'USR-001',
        userName: 'Administrator',
        action: 'UPDATE_STATUS',
        targetType: 'User',
        targetId: 'USR-005',
        oldValue: 'Active',
        newValue: 'Inactive',
        ipAddress: '192.168.1.10'
    },
    {
        id: 'AUD-005',
        timestamp: hoursAgo(12),
        userId: 'USR-001',
        userName: 'Administrator',
        action: 'CREATE',
        targetType: 'Team',
        targetId: 'TEAM-008',
        newValue: 'Electrical Team B created',
        ipAddress: '192.168.1.10'
    },
    {
        id: 'AUD-006',
        timestamp: daysAgo(1),
        userId: 'USR-002',
        userName: 'Officer Sharma',
        action: 'RESOLVE',
        targetType: 'Ticket',
        targetId: 'TKT-1015',
        oldValue: 'In Progress',
        newValue: 'Resolved',
        ipAddress: '192.168.1.45'
    }
];

// Mock Ward Stats
export const mockWardStats: WardStats[] = [
    { wardId: 'W001', wardName: 'Ward 1 - Downtown', totalIssues: 156, resolvedIssues: 142, avgResolutionTime: 18.5, slaComplianceRate: 94 },
    { wardId: 'W002', wardName: 'Ward 2 - Residential North', totalIssues: 89, resolvedIssues: 85, avgResolutionTime: 12.3, slaComplianceRate: 97 },
    { wardId: 'W003', wardName: 'Ward 3 - Green Belt', totalIssues: 45, resolvedIssues: 44, avgResolutionTime: 8.2, slaComplianceRate: 98 },
    { wardId: 'W004', wardName: 'Ward 4 - Central', totalIssues: 234, resolvedIssues: 210, avgResolutionTime: 22.1, slaComplianceRate: 89 },
    { wardId: 'W005', wardName: 'Ward 5 - Industrial', totalIssues: 178, resolvedIssues: 165, avgResolutionTime: 25.4, slaComplianceRate: 86 },
    { wardId: 'W006', wardName: 'Ward 6 - Commercial', totalIssues: 123, resolvedIssues: 115, avgResolutionTime: 16.8, slaComplianceRate: 92 },
    { wardId: 'W007', wardName: 'Ward 7 - Market District', totalIssues: 198, resolvedIssues: 180, avgResolutionTime: 20.5, slaComplianceRate: 88 }
];

// Mock System Feed
export const mockSystemFeed: SystemFeedItem[] = [
    { id: 'SF-001', timestamp: hoursAgo(0.1), type: 'auto_assign', message: 'Auto-assigned Ticket #1024 to Road Team A based on proximity', ticketId: 'TKT-1024' },
    { id: 'SF-002', timestamp: hoursAgo(0.3), type: 'sla_warning', message: 'Ticket #1021 approaching SLA deadline (2 hours remaining)', ticketId: 'TKT-1021' },
    { id: 'SF-003', timestamp: hoursAgo(0.5), type: 'duplicate_flagged', message: 'Ticket #1019 flagged as potential duplicate of #1018', ticketId: 'TKT-1019' },
    { id: 'SF-004', timestamp: hoursAgo(1), type: 'resolution', message: 'Ticket #1018 marked as resolved by Sanitation Team A', ticketId: 'TKT-1018' },
    { id: 'SF-005', timestamp: hoursAgo(1.5), type: 'escalation', message: 'Ticket #1021 escalated to critical priority due to citizen reports', ticketId: 'TKT-1021' }
];

// Helper to get urgent tickets (priority > 75)
export const getUrgentTickets = () => mockTickets.filter(t => t.priorityScore > 75 && t.status !== 'resolved' && t.status !== 'closed');

// Helper to get unassigned tickets
export const getUnassignedTickets = () => mockTickets.filter(t => !t.assignedTeamId && t.status === 'open');

// Helper to get available teams
export const getAvailableTeams = () => mockTeams.filter(t => t.status === 'available');

// Helper to get online teams count
export const getOnlineTeamsCount = () => mockTeams.filter(t => t.status !== 'offline').length;
