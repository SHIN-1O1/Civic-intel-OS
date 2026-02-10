import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    query,
    orderBy,
    Timestamp,
    addDoc
} from 'firebase/firestore';
import {
    Ticket,
    PredictiveAlert,
    RiskLevel,
    Department,
    CATEGORY_TO_DEPARTMENT
} from '@/lib/types';

/**
 * PredictiveService analyzes historical ticket patterns to predict
 * infrastructure failures before they happen. Uses frequency analysis
 * and category clustering by location.
 */
export class PredictiveService {

    /**
     * Analyze ticket history and generate predictive maintenance alerts.
     * Groups tickets by location+category, identifies recurring patterns,
     * and scores risk based on frequency, recency, and severity.
     */
    async generatePredictiveAlerts(tickets?: Ticket[]): Promise<PredictiveAlert[]> {
        // Fetch tickets if not provided
        if (!tickets) {
            const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(ticketsQuery);
            tickets = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
                    slaDeadline: data.slaDeadline?.toDate?.() || new Date(data.slaDeadline),
                } as Ticket;
            });
        }

        // Group tickets by location ward + category
        const patternMap = new Map<string, {
            ward: string;
            address: string;
            lat: number;
            lng: number;
            category: string;
            tickets: Ticket[];
        }>();

        for (const ticket of tickets) {
            const key = `${ticket.location.ward}::${ticket.category}`;
            if (!patternMap.has(key)) {
                patternMap.set(key, {
                    ward: ticket.location.ward,
                    address: ticket.location.address,
                    lat: ticket.location.lat,
                    lng: ticket.location.lng,
                    category: ticket.category,
                    tickets: []
                });
            }
            patternMap.get(key)!.tickets.push(ticket);
        }

        // Generate alerts for patterns with recurrence (2+ tickets)
        const alerts: PredictiveAlert[] = [];
        const now = new Date();

        for (const [, pattern] of patternMap) {
            if (pattern.tickets.length < 2) continue;

            const sortedTickets = pattern.tickets.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            // Calculate average interval between incidents
            const intervals: number[] = [];
            for (let i = 0; i < sortedTickets.length - 1; i++) {
                const interval = sortedTickets[i].createdAt.getTime() - sortedTickets[i + 1].createdAt.getTime();
                intervals.push(interval);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

            // Predict next occurrence
            const lastIncident = sortedTickets[0].createdAt;
            const predictedDate = new Date(lastIncident.getTime() + avgInterval);

            // Calculate risk score (0-100)
            const recencyFactor = Math.max(0, 1 - (now.getTime() - lastIncident.getTime()) / (30 * 24 * 60 * 60 * 1000)); // decay over 30 days
            const frequencyFactor = Math.min(1, pattern.tickets.length / 10); // cap at 10 incidents
            const severityFactor = pattern.tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length / pattern.tickets.length;
            const overdueFactor = predictedDate <= now ? 0.3 : 0; // bonus if prediction is overdue

            const riskScore = Math.round(
                (recencyFactor * 30 + frequencyFactor * 30 + severityFactor * 25 + overdueFactor * 15) * 100 / 100
            );

            const riskLevel: RiskLevel =
                riskScore >= 75 ? 'critical' :
                    riskScore >= 50 ? 'high' :
                        riskScore >= 25 ? 'medium' : 'low';

            // Generate recommendation
            const daysUntil = Math.max(0, Math.round((predictedDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
            const recommendation = this.generateRecommendation(pattern.category, daysUntil, pattern.tickets.length, riskLevel);

            const department = CATEGORY_TO_DEPARTMENT[pattern.category] || 'roads_infrastructure' as Department;

            alerts.push({
                id: `pred_${pattern.ward}_${pattern.category}`.replace(/\s+/g, '_').toLowerCase(),
                location: {
                    ward: pattern.ward,
                    address: pattern.address,
                    lat: pattern.lat,
                    lng: pattern.lng
                },
                category: pattern.category,
                department,
                riskScore,
                riskLevel,
                predictedDate,
                recurrenceCount: pattern.tickets.length,
                recommendation,
                lastIncidentDate: lastIncident,
                createdAt: now
            });
        }

        // Sort by risk score descending
        return alerts.sort((a, b) => b.riskScore - a.riskScore);
    }

    /**
     * Generate a human-readable recommendation based on the pattern analysis.
     */
    private generateRecommendation(
        category: string,
        daysUntil: number,
        incidentCount: number,
        riskLevel: RiskLevel
    ): string {
        const urgency = daysUntil === 0
            ? 'Immediate action required'
            : daysUntil <= 7
                ? `Schedule within ${daysUntil} days`
                : `Plan maintenance within ${daysUntil} days`;

        const patterns: Record<string, string> = {
            'Pothole': 'Road surface deterioration detected. Schedule resurfacing crew.',
            'Street Light': 'Electrical infrastructure aging. Inspect wiring and replace fixtures.',
            'Water Leak': 'Pipeline stress detected. Inspect joints and valve seals.',
            'Garbage Pile': 'Collection route inefficiency. Review pickup schedule and capacity.',
            'Tree Fall': 'Vegetation risk area. Schedule pruning and structural assessment.',
            'Drainage Block': 'Drainage system degradation. Schedule cleaning and pipe inspection.',
            'Road Issues': 'Road infrastructure wear pattern. Plan preventive resurfacing.',
        };

        const specific = patterns[category] || `Recurring ${category} issues require systematic intervention.`;

        return `${urgency}. ${specific} (${incidentCount} incidents recorded, risk: ${riskLevel})`;
    }

    /**
     * Store generated alerts in Firestore for dashboard access.
     */
    async storeAlerts(alerts: PredictiveAlert[]): Promise<void> {
        for (const alert of alerts.slice(0, 20)) { // Limit to top 20
            await addDoc(collection(db, 'predictive_alerts'), {
                ...alert,
                predictedDate: Timestamp.fromDate(alert.predictedDate),
                lastIncidentDate: Timestamp.fromDate(alert.lastIncidentDate),
                createdAt: Timestamp.fromDate(alert.createdAt)
            });
        }
    }
}

export const predictiveService = new PredictiveService();
