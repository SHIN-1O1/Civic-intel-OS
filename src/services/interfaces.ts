import { Ticket, Team, User, AuditLog, KPIData, WardStats, SystemFeedItem, PortalUser, SystemConfig } from '@/lib/types';

export interface ApiService {
    // Tickets
    getTickets(): Promise<Ticket[]>;
    getTicket(id: string): Promise<Ticket | null>;
    createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket>;
    updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;

    // Teams
    getTeams(): Promise<Team[]>;
    createTeam(team: Omit<Team, 'id' | 'status' | 'role' | 'currentTask' | 'currentTaskLocation' | 'location' | 'members' | 'shiftEnd' | 'capacity'> & { shiftEnd?: Date | string; maxCapacity?: number }): Promise<Team>;
    updateTeam(id: string, updates: Partial<Team>): Promise<Team>;
    deleteTeam(id: string): Promise<void>;

    // Users
    getUsers(): Promise<User[]>;
    createUser(user: Omit<User, 'id' | 'lastLogin' | 'isActive'>): Promise<User>;

    // Portal Users
    getPortalUsers(): Promise<PortalUser[]>;
    deletePortalUser(id: string): Promise<void>;

    // Analytics
    getKPIData(): Promise<KPIData>;
    getWardStats(): Promise<WardStats[]>;
    getAuditLogs(): Promise<AuditLog[]>;
    getSystemFeed(): Promise<SystemFeedItem[]>;

    // System Config
    getSystemConfig(): Promise<SystemConfig>;

    // AI
    assessTicket(ticket: Ticket): Promise<Ticket>;
}

