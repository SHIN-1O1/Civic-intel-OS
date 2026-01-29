import { Ticket, Team, User, AuditLog, KPIData, WardStats, SystemFeedItem, PortalUser, SystemConfig } from '@/lib/types';
import { FirebaseService } from './firebase-service';
import { ApiService } from './interfaces';

export type { ApiService };

// Production mode - use Firebase only
export const api: ApiService = new FirebaseService();
