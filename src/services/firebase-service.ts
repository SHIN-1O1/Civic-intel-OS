import { ApiService } from './interfaces';
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import {
    Ticket,
    Team,
    User,
    AuditLog,
    KPIData,
    WardStats,
    SystemFeedItem,
    CitizenReport,
    TicketStatus,
    Department,
    CATEGORY_TO_DEPARTMENT,
    PortalUser,
    SystemConfig
} from '@/lib/types';
import { geminiService } from './gemini-service';

// Helper function to parse location string and extract ward
function parseLocation(locationString: string): { ward: string; address: string; lat: number; lng: number } {
    // Extract ward from location string format: "Area, Ward, District, City, State, PIN, Country"
    const parts = locationString.split(',').map(p => p.trim());

    // Try to identify ward/district from the parts
    let ward = 'Unknown Ward';
    if (parts.length >= 3) {
        // Typically ward is the 2nd or 3rd part
        ward = parts[1] || parts[2] || 'Central';
    }

    // TODO: Integrate geocoding service (Google Maps or OpenStreetMap Nominatim) to get actual coordinates
    // For now, use default coordinates (can be enhanced with geocoding API later)
    return {
        ward,
        address: locationString,
        lat: 28.6139, // Default Delhi coordinates - FIXME: implement geocoding
        lng: 77.2090
    };
}

// Helper function to convert CitizenReport to Ticket
function convertReportToTicket(report: CitizenReport, ticketNumber: number): Ticket {
    const location = parseLocation(report.location);

    // Map severity to priority score
    const severityToScore: Record<string, number> = {
        'Critical': 90,
        'High': 75,
        'Medium': 50,
        'Low': 25
    };

    const priorityScore = severityToScore[report.severity] || 50;

    // Map status
    const statusMap: Record<string, TicketStatus> = {
        'Pending': 'open',
        'In Progress': 'in_progress',
        'Resolved': 'resolved'
    };

    const status = statusMap[report.status] || 'open';

    // Calculate SLA deadline based on priority
    const slaHours = priorityScore >= 80 ? 4 : priorityScore >= 60 ? 8 : priorityScore >= 40 ? 24 : 48;
    const slaDeadline = new Date(report.timestamp);
    slaDeadline.setHours(slaDeadline.getHours() + slaHours);

    // Calculate SLA stage
    const now = new Date();
    const timeRemaining = slaDeadline.getTime() - now.getTime();
    const slaStage = timeRemaining < 0 ? 'breached' : timeRemaining < (slaHours * 0.25 * 3600000) ? 'at_risk' : 'on_track';

    return {
        id: report.id,
        ticketNumber,
        type: report.category,
        category: report.category,
        description: report.description,
        status,
        priority: priorityScore >= 80 ? 'critical' : priorityScore >= 60 ? 'high' : priorityScore >= 40 ? 'medium' : 'low',
        priorityScore,
        location,
        reportCount: 1,
        slaDeadline,
        slaStage,
        createdAt: report.timestamp,
        updatedAt: report.timestamp,
        imageUrl: report.hasImage ? report.imageUrl : undefined,
        aiAssessment: report.aiVerified ? {
            severity: report.severity,
            reason: report.summary,
            suggestedDepartment: report.category,
            suggestedSkill: 'General',
            estimatedTime: `${slaHours} hours`
        } : undefined,
        activityLog: [{
            id: `${report.id}-init`,
            timestamp: report.timestamp,
            action: 'Ticket created from citizen report',
            actor: 'System',
            actorRole: 'super_admin'
        }],
        internalNotes: []
    };
}

export class FirebaseService implements ApiService {

    // ============ Tickets ============
    async getTickets(): Promise<Ticket[]> {
        try {
            // Fetch both tickets and citizen complaints
            const ticketsQuery = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
            const complaintsQuery = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));

            const [ticketsSnapshot, complaintsSnapshot] = await Promise.all([
                getDocs(ticketsQuery),
                getDocs(complaintsQuery)
            ]);

            // Convert tickets
            const tickets = ticketsSnapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertTimestamps(data) as Ticket;
            });

            // Convert citizen complaints to tickets
            const citizenTickets = complaintsSnapshot.docs.map((doc, index) => {
                const data = doc.data();
                const report: CitizenReport = {
                    id: doc.id,
                    userId: data.userId || '',
                    category: data.category || 'General',
                    description: data.description || '',
                    summary: data.summary || '',
                    location: data.location || '',
                    severity: data.severity || 'Medium',
                    status: data.status || 'Pending',
                    timestamp: data.timestamp?.toDate() || new Date(),
                    date: data.date || '',
                    hasImage: data.hasImage || false,
                    imageUrl: data.imageUrl,
                    aiVerified: data.aiVerified || false
                };

                // Generate ticket number based on total count
                const ticketNumber = 1000 + tickets.length + index;
                return convertReportToTicket(report, ticketNumber);
            });

            // Merge and sort by creation date
            return [...tickets, ...citizenTickets].sort((a, b) =>
                b.createdAt.getTime() - a.createdAt.getTime()
            );
        } catch (error) {
            // Check if this is a permission error or missing collection
            const errorCode = (error as any)?.code;
            const isExpectedError = errorCode === 'permission-denied' ||
                errorCode === 'not-found' ||
                (error as any)?.message?.includes('does not exist');

            if (!isExpectedError) {
                console.error('Unexpected error fetching tickets:', error);
                throw error; // Re-throw unexpected errors
            }

            console.warn('Complaints collection not accessible, falling back to tickets only');
            // Fallback to just tickets if complaints collection doesn't exist
            const q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertTimestamps(data) as Ticket;
            });
        }
    }

    async getTicket(id: string): Promise<Ticket | null> {
        // First try tickets collection
        const ticketRef = doc(db, 'tickets', id);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
            return this.convertTimestamps(ticketSnap.data()) as Ticket;
        }

        // If not found, try complaints collection and convert
        const complaintRef = doc(db, 'complaints', id);
        const complaintSnap = await getDoc(complaintRef);

        if (complaintSnap.exists()) {
            const data = complaintSnap.data();
            const report: CitizenReport = {
                id: complaintSnap.id,
                userId: data.userId || '',
                category: data.category || 'General',
                description: data.description || '',
                summary: data.summary || '',
                location: data.location || '',
                severity: data.severity || 'Medium',
                status: data.status || 'Pending',
                timestamp: data.timestamp?.toDate() || new Date(),
                date: data.date || '',
                hasImage: data.hasImage || false,
                imageUrl: data.imageUrl,
                aiVerified: data.aiVerified || false
            };

            // Generate deterministic ticket number from document ID
            const ticketNumber = 1000 + parseInt(complaintSnap.id.replace(/\D/g, '').slice(-4) || '0', 10);
            return convertReportToTicket(report, ticketNumber);
        }

        return null;
    }

    async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
        // Use crypto.randomUUID for collision-resistant ID generation
        const newId = `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const now = new Date();

        const newTicket: Ticket = {
            ...ticketData,
            id: newId,
            createdAt: now,
            updatedAt: now,
            activityLog: [
                {
                    id: crypto.randomUUID(),
                    timestamp: now,
                    action: 'Ticket created',
                    actor: 'System',
                    actorRole: 'super_admin'
                }
            ],
            internalNotes: []
        };

        // AI Assessment
        try {
            const assessment = await geminiService.assessTicket(newTicket);
            if (assessment) {
                newTicket.aiAssessment = {
                    severity: assessment.severity || 'Medium',
                    reason: assessment.reason || 'AI assessment pending',
                    suggestedDepartment: assessment.suggestedDepartment || newTicket.category,
                    suggestedSkill: assessment.suggestedSkill || 'General',
                    estimatedTime: assessment.estimatedTime || '24 hours'
                };
                newTicket.activityLog.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    action: 'AI Assessment applied',
                    actor: 'Gemini AI',
                    actorRole: 'super_admin'
                });
            }
        } catch (e) {
            console.error("AI assessment failed during creation", e);
        }

        const firestoreData = JSON.parse(JSON.stringify(newTicket));
        // Convert dates to Timestamps manually for proper storage
        firestoreData.createdAt = Timestamp.fromDate(newTicket.createdAt);
        firestoreData.updatedAt = Timestamp.fromDate(newTicket.updatedAt);
        // Null-safe slaDeadline conversion with 24h default
        firestoreData.slaDeadline = newTicket.slaDeadline
            ? Timestamp.fromDate(newTicket.slaDeadline)
            : Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
        if (firestoreData.activityLog) {
            firestoreData.activityLog = firestoreData.activityLog.map((l: any) => ({ ...l, timestamp: Timestamp.fromDate(new Date(l.timestamp)) }));
        }

        await setDoc(doc(db, 'tickets', newId), firestoreData);
        return newTicket;
    }

    async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
        const now = new Date();
        // Convert any Date fields to Firestore Timestamps
        const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.fromDate(now) };
        if (updates.slaDeadline instanceof Date) {
            updateData.slaDeadline = Timestamp.fromDate(updates.slaDeadline);
        }
        if (updates.createdAt instanceof Date) {
            updateData.createdAt = Timestamp.fromDate(updates.createdAt);
        }

        // First try to update in the tickets collection
        const ticketRef = doc(db, 'tickets', id);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
            // Document exists in tickets collection
            await updateDoc(ticketRef, updateData);
            const updated = await this.getTicket(id);
            if (!updated) throw new Error("Ticket not found after update");
            return updated;
        }

        // If not in tickets, try complaints collection
        const complaintRef = doc(db, 'complaints', id);
        const complaintSnap = await getDoc(complaintRef);

        if (complaintSnap.exists()) {
            // Document exists in complaints collection
            // Map the Ticket updates to CitizenReport schema
            const mappedUpdates: any = {};

            if (updates.status) {
                // Map admin status to citizen report status
                const statusMap: Record<string, string> = {
                    'open': 'Pending',
                    'assigned': 'Pending',
                    'in_progress': 'In Progress',
                    'on_site': 'In Progress',
                    'resolved': 'Resolved'
                };
                mappedUpdates.status = statusMap[updates.status] || updates.status;
            }

            if (updates.priorityScore !== undefined) {
                // Map priority score to severity
                if (updates.priorityScore >= 90) mappedUpdates.severity = 'Critical';
                else if (updates.priorityScore >= 75) mappedUpdates.severity = 'High';
                else if (updates.priorityScore >= 50) mappedUpdates.severity = 'Medium';
                else mappedUpdates.severity = 'Low';
            }

            // Pass through assignment fields directly
            if (updates.assignedTeam) mappedUpdates.assignedTeam = updates.assignedTeam;
            if (updates.assignedTeamId) mappedUpdates.assignedTeamId = updates.assignedTeamId;
            if (updates.assignedDepartment) mappedUpdates.assignedDepartment = updates.assignedDepartment;

            // Update in complaints collection
            mappedUpdates.updatedAt = Timestamp.fromDate(now);
            await updateDoc(complaintRef, mappedUpdates);

            // Return the updated ticket
            const updated = await this.getTicket(id);
            if (!updated) throw new Error("Ticket not found after update");
            return updated;
        }

        throw new Error(`No document found with id: ${id} in either tickets or complaints collection`);
    }

    async assessTicket(ticket: Ticket): Promise<Ticket> {
        const assessment = await geminiService.assessTicket(ticket);

        if (!assessment) {
            throw new Error('Failed to get AI assessment');
        }

        const updates = {
            aiAssessment: {
                severity: assessment.severity || 'Medium',
                reason: assessment.reason || 'Manual Trigger',
                suggestedDepartment: assessment.suggestedDepartment || ticket.category,
                suggestedSkill: assessment.suggestedSkill || 'General',
                estimatedTime: assessment.estimatedTime || '24 hours'
            }
        };
        return this.updateTicket(ticket.id, updates);
    }

    // ============ Teams ============
    async getTeams(): Promise<Team[]> {
        const snapshot = await getDocs(collection(db, 'teams'));
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                // Null-safe shiftEnd conversion
                shiftEnd: data.shiftEnd?.toDate?.() || new Date()
            } as Team;
        });
    }

    async createTeam(teamData: Omit<Team, 'id' | 'status' | 'location' | 'members' | 'shiftEnd' | 'capacity'> & { shiftEnd?: Date | string, maxCapacity?: number }): Promise<Team> {
        const newTeamRef = doc(collection(db, 'teams'));
        const shiftEndDate = new Date(teamData.shiftEnd || Date.now());

        // Create the team object with proper types
        const team: Team = {
            ...teamData,
            id: newTeamRef.id,
            shiftEnd: shiftEndDate,
            status: 'available',
            capacity: { current: 0, max: teamData.maxCapacity || 10 },
            members: []
        };

        // Store in Firestore with Timestamp for shiftEnd
        const firestoreData = {
            ...team,
            shiftEnd: Timestamp.fromDate(shiftEndDate)
        };

        await setDoc(newTeamRef, firestoreData);
        return team;
    }

    async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
        const docRef = doc(db, 'teams', id);

        // Check if document exists before updating
        const existsCheck = await getDoc(docRef);
        if (!existsCheck.exists()) {
            throw new Error(`Team with id ${id} not found`);
        }

        await updateDoc(docRef, updates);

        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error(`Team with id ${id} not found after update`);
        }
        const data = docSnap.data();
        return { ...data, shiftEnd: data.shiftEnd?.toDate?.() || new Date() } as Team;
    }

    async deleteTeam(id: string): Promise<void> {
        const docRef = doc(db, 'teams', id);
        const existsCheck = await getDoc(docRef);
        if (!existsCheck.exists()) {
            throw new Error(`Team with id ${id} not found`);
        }
        await import('firebase/firestore').then(m => m.deleteDoc(docRef));
    }

    // ============ Portal Users ============
    async getPortalUsers(): Promise<PortalUser[]> {
        const snapshot = await getDocs(collection(db, 'portalUsers'));
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name || '',
                role: data.role || 'department_hq',
                department: data.department
            } as PortalUser;
        });
    }

    async deletePortalUser(id: string): Promise<void> {
        const docRef = doc(db, 'portalUsers', id);
        const existsCheck = await getDoc(docRef);
        if (!existsCheck.exists()) {
            throw new Error(`Portal user with id ${id} not found`);
        }
        await import('firebase/firestore').then(m => m.deleteDoc(docRef));
    }

    // ============ System Config ============
    async getSystemConfig(): Promise<SystemConfig> {
        const docRef = doc(db, 'systemConfig', 'main');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as SystemConfig;
        }

        // Return default config if not found
        return {
            departments: [
                { key: 'roads_infrastructure', label: 'Roads & Infrastructure', isActive: true },
                { key: 'sanitation', label: 'Sanitation', isActive: true },
                { key: 'electrical', label: 'Electrical', isActive: true },
                { key: 'parks_gardens', label: 'Parks & Gardens', isActive: true },
                { key: 'water_supply', label: 'Water Supply', isActive: true },
                { key: 'drainage', label: 'Drainage', isActive: true }
            ]
        };
    }


    // ============ Users ============
    async getUsers(): Promise<User[]> {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                lastLogin: data.lastLogin ? data.lastLogin.toDate() : undefined
            } as User;
        });
    }

    async createUser(userData: Omit<User, 'id' | 'lastLogin' | 'isActive'>): Promise<User> {
        const newUserRef = doc(collection(db, 'users'));
        const user: User = {
            ...userData,
            id: newUserRef.id,
            isActive: true,
            lastLogin: undefined
        };
        await setDoc(newUserRef, user);
        return user;
    }

    // ============ Analytics ============
    async getKPIData(): Promise<KPIData> {
        // Calculate KPI data dynamically from tickets
        const tickets = await this.getTickets();
        const teams = await this.getTeams();

        // Calculate critical load (high priority open tickets)
        const criticalTickets = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved');
        const criticalLoad = criticalTickets.length;

        // Calculate SLA breaches (tickets past deadline)
        const now = new Date();
        const slaBreaches = tickets.filter(t => {
            const deadline = new Date(t.slaDeadline);
            return t.status !== 'resolved' && deadline < now;
        }).length;

        // Calculate workforce metrics
        const onlineTeams = teams.filter(t => t.status !== 'offline').length;

        // Calculate average response time (time from creation to first assignment)
        const assignedTickets = tickets.filter(t => t.assignedTeam);
        const responseTimes = assignedTickets.map(t => {
            const created = new Date(t.createdAt);
            const updated = new Date(t.updatedAt);
            return (updated.getTime() - created.getTime()) / (1000 * 60); // in minutes
        });
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;

        // Calculate average resolution time (time from creation to resolution)
        const resolvedTickets = tickets.filter(t => t.status === 'resolved');
        const resolutionTimes = resolvedTickets.map(t => {
            const created = new Date(t.createdAt);
            const updated = new Date(t.updatedAt);
            return (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // in hours
        });
        const avgResolutionTime = resolutionTimes.length > 0
            ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length * 10) / 10
            : 0;

        // Calculate SLA compliance rate
        const slaCompliantTickets = tickets.filter(t => {
            if (t.status !== 'resolved') return false;
            const deadline = new Date(t.slaDeadline);
            const resolved = new Date(t.updatedAt);
            return resolved <= deadline;
        });
        // Use only resolved tickets in the denominator for accurate SLA compliance
        const slaComplianceRate = resolvedTickets.length > 0
            ? Math.round((slaCompliantTickets.length / resolvedTickets.length) * 100 * 10) / 10
            : 0;

        return {
            criticalLoad,
            criticalLoadTrend: 0, // Could calculate from historical data
            slaBreaches,
            activeWorkforce: {
                online: onlineTeams,
                total: teams.length
            },
            avgResponseTime,
            avgResponseTrend: 0, // Could calculate from historical data
            avgResolutionTime,
            slaComplianceRate
        };
    }

    async getWardStats(): Promise<WardStats[]> {
        // Calculate ward stats dynamically from tickets
        const tickets = await this.getTickets();
        const wardMap = new Map<string, { total: number; resolved: number; resolutionTimes: number[] }>();

        tickets.forEach(ticket => {
            const wardKey = ticket.location.ward || 'Unknown Ward';

            if (!wardMap.has(wardKey)) {
                wardMap.set(wardKey, { total: 0, resolved: 0, resolutionTimes: [] });
            }

            const wardData = wardMap.get(wardKey)!;
            wardData.total++;

            if (ticket.status === 'resolved') {
                wardData.resolved++;
                // Calculate resolution time if available
                if (ticket.createdAt && ticket.updatedAt) {
                    const created = new Date(ticket.createdAt);
                    const updated = new Date(ticket.updatedAt);
                    const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
                    wardData.resolutionTimes.push(hours);
                }
            }
        });

        // Convert map to WardStats array
        const wardStats: WardStats[] = Array.from(wardMap.entries()).map(([wardName, data], index) => {
            const avgResolutionTime = data.resolutionTimes.length > 0
                ? Math.round(data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length)
                : 0;

            const slaComplianceRate = data.total > 0
                ? Math.round((data.resolved / data.total) * 100)
                : 0;

            return {
                // Derive stable wardId from ward name slug
                wardId: `WARD-${wardName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
                wardName,
                totalIssues: data.total,
                resolvedIssues: data.resolved,
                avgResolutionTime,
                slaComplianceRate
            };
        });

        return wardStats.sort((a, b) => b.slaComplianceRate - a.slaComplianceRate);
    }

    async getAuditLogs(): Promise<AuditLog[]> {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { ...data, timestamp: data.timestamp.toDate() } as AuditLog;
        });
    }

    async getSystemFeed(): Promise<SystemFeedItem[]> {
        const q = query(collection(db, 'systemFeed'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { ...data, timestamp: data.timestamp.toDate() } as SystemFeedItem;
        });
    }

    // ============ Helper ============
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private convertTimestamps(data: any): any {
        if (!data) return data;

        if (data instanceof Timestamp) {
            return data.toDate();
        }

        if (Array.isArray(data)) {
            return data.map(item => this.convertTimestamps(item));
        }

        if (typeof data === 'object') {
            const newData: any = {};
            for (const key in data) {
                newData[key] = this.convertTimestamps(data[key]);
            }
            return newData;
        }

        return data;
    }

    // ============ Real-time Subscriptions for Auto-refresh ============

    subscribeToTickets(callback: (tickets: Ticket[]) => void): Unsubscribe {
        const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        const complaintsQuery = query(collection(db, 'complaints'), orderBy('timestamp', 'desc'));

        let ticketsFromCollection: Ticket[] = [];
        let complaintsAsTickets: Ticket[] = [];

        const mergeAndCallback = () => {
            const allTickets = [...ticketsFromCollection, ...complaintsAsTickets];
            callback(allTickets);
        };

        // Subscribe to tickets collection
        const unsubTickets = onSnapshot(ticketsQuery, (snapshot) => {
            ticketsFromCollection = snapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertTimestamps({
                    ...data,
                    id: doc.id
                }) as Ticket;
            });
            mergeAndCallback();
        });

        // Subscribe to complaints collection
        const unsubComplaints = onSnapshot(complaintsQuery, (snapshot) => {
            complaintsAsTickets = snapshot.docs.map(doc => {
                const report = doc.data() as CitizenReport;
                return this.convertReportToTicketSimple(doc.id, report);
            });
            mergeAndCallback();
        }, () => {
            // Silently ignore errors on complaints collection (may not exist)
            complaintsAsTickets = [];
        });

        // Return combined unsubscribe function
        return () => {
            unsubTickets();
            unsubComplaints();
        };
    }

    subscribeToTicketsByDepartment(
        department: Department,
        callback: (tickets: Ticket[]) => void
    ): Unsubscribe {
        const q = query(
            collection(db, 'tickets'),
            where('assignedDepartment', '==', department),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertTimestamps({
                    ...data,
                    id: doc.id
                }) as Ticket;
            });
            callback(tickets);
        });
    }

    subscribeToTeamsByDepartment(
        department: Department,
        callback: (teams: Team[]) => void
    ): Unsubscribe {
        const departmentLabel = {
            roads_infrastructure: 'Roads & Infrastructure',
            sanitation: 'Sanitation',
            electrical: 'Electrical',
            parks_gardens: 'Parks & Gardens',
            water_supply: 'Water Supply',
            drainage: 'Drainage'
        }[department];

        const q = query(
            collection(db, 'teams'),
            where('department', '==', departmentLabel)
        );

        return onSnapshot(q, (snapshot) => {
            const teams = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    shiftEnd: data.shiftEnd?.toDate?.() || data.shiftEnd
                } as Team;
            });
            callback(teams);
        });
    }

    // Assign ticket to department based on category
    async assignTicketToDepartment(ticketId: string, teamId: string, teamName: string): Promise<Ticket> {
        // Get the ticket to determine its category
        const ticket = await this.getTicket(ticketId);
        if (!ticket) throw new Error('Ticket not found');

        // Determine department from category
        const department = CATEGORY_TO_DEPARTMENT[ticket.category] ||
            CATEGORY_TO_DEPARTMENT[ticket.type] ||
            'sanitation'; // default fallback

        // Update ticket with assignment
        return this.updateTicket(ticketId, {
            assignedTeam: teamName,
            assignedTeamId: teamId,
            assignedDepartment: department,
            status: 'assigned' as TicketStatus
        });
    }

    // Simplified version for real-time subscriptions (different from module-level convertReportToTicket)
    private convertReportToTicketSimple(id: string, report: CitizenReport): Ticket {
        const location = parseLocation(report.location);
        const timestamp = typeof report.timestamp === 'object' && 'toDate' in report.timestamp
            ? (report.timestamp as any).toDate()
            : new Date(report.timestamp);

        return {
            id,
            // Deterministic ticket number from document ID
            ticketNumber: 1000 + parseInt(id.replace(/\D/g, '').slice(-4) || '0', 10),
            type: report.category,
            category: report.category,
            description: report.description,
            status: 'open',
            priority: 'medium',
            priorityScore: 50,
            location,
            reportCount: 1,
            slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            slaStage: 'on_track',
            createdAt: timestamp,
            updatedAt: timestamp,
            citizenName: report.userId,
            activityLog: [],
            internalNotes: []
        };
    }
}
