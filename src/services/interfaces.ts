import { Ticket, Team, User, AuditLog, KPIData, WardStats, SystemFeedItem } from '@/lib/types';

export interface ApiService {
    // Tickets
    getTickets(): Promise<Ticket[]>;
    getTicket(id: string): Promise<Ticket | null>;
    createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket>;
    updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket>;

    // Teams
    getTeams(): Promise<Team[]>;
    updateTeam(id: string, updates: Partial<Team>): Promise<Team>;

    // Users
    getUsers(): Promise<User[]>;

    // Analytics
    getKPIData(): Promise<KPIData>;
    getWardStats(): Promise<WardStats[]>;
    getAuditLogs(): Promise<AuditLog[]>;
    getSystemFeed(): Promise<SystemFeedItem[]>;

    // AI
    assessTicket(ticket: Ticket): Promise<Ticket>;
}
