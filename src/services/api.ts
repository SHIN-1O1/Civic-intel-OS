import { Ticket, Team, User, AuditLog, KPIData, WardStats, SystemFeedItem } from '@/lib/types';
import { mockTickets, mockTeams, mockUsers, mockAuditLogs, mockKPIData, mockWardStats, mockSystemFeed } from '@/lib/mock-data';
import { FirebaseService } from './firebase-service';
import { ApiService } from './interfaces';

export type { ApiService };

class MockService implements ApiService {
    async getTickets(): Promise<Ticket[]> { return mockTickets; }
    async getTicket(id: string): Promise<Ticket | null> { return mockTickets.find(t => t.id === id) || null; }
    async createTicket(ticket: any): Promise<Ticket> { return { ...ticket, id: `TKT-${Math.floor(Math.random() * 10000)}`, createdAt: new Date(), updatedAt: new Date() }; }
    async updateTicket(id: string, updates: any): Promise<Ticket> { return { ...mockTickets.find(t => t.id === id)!, ...updates }; }
    async getTeams(): Promise<Team[]> { return mockTeams; }
    async updateTeam(id: string, updates: any): Promise<Team> { return { ...mockTeams.find(t => t.id === id)!, ...updates }; }
    async getUsers(): Promise<User[]> { return mockUsers; }
    async getKPIData(): Promise<KPIData> { return mockKPIData; }
    async getWardStats(): Promise<WardStats[]> { return mockWardStats; }
    async getAuditLogs(): Promise<AuditLog[]> { return mockAuditLogs; }
    async getSystemFeed(): Promise<SystemFeedItem[]> { return mockSystemFeed; }
    async assessTicket(ticket: Ticket): Promise<Ticket> { return ticket; }
}

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const api: ApiService = isDemoMode ? new MockService() : new FirebaseService();
