import { getAuth } from 'firebase/auth';

/**
 * Secure API client for making authenticated requests to server-side API routes.
 * All write operations should go through these functions to ensure proper
 * authentication, authorization, and audit logging.
 */

interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Get the current user's Firebase ID token
 */
async function getIdToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.warn('[API Client] No authenticated user');
        return null;
    }

    try {
        return await user.getIdToken();
    } catch (error) {
        console.error('[API Client] Failed to get ID token:', error);
        return null;
    }
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const idToken = await getIdToken();

    if (!idToken) {
        return {
            error: 'Not authenticated',
            status: 401,
        };
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        ...options.headers,
    };

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            return {
                error: data?.error || response.statusText,
                status: response.status,
            };
        }

        return {
            data,
            status: response.status,
        };
    } catch (error) {
        console.error('[API Client] Request failed:', error);
        return {
            error: 'Network error',
            status: 0,
        };
    }
}

/**
 * Ticket API client
 */
export const ticketApi = {
    /**
     * Get all tickets
     */
    async getAll(limit: number = 50) {
        return apiRequest<{ tickets: unknown[] }>(`/api/tickets?limit=${limit}`, {
            method: 'GET',
        });
    },

    /**
     * Get a single ticket by ID
     */
    async getById(id: string) {
        return apiRequest<{ ticket: unknown }>(`/api/tickets/${encodeURIComponent(id)}`, {
            method: 'GET',
        });
    },

    /**
     * Create a new ticket
     */
    async create(ticketData: {
        type: string;
        category: string;
        description: string;
        priority?: string;
        priorityScore?: number;
        location: {
            ward: string;
            address: string;
            lat: number;
            lng: number;
        };
        citizenName?: string;
        citizenPhone?: string;
        imageUrl?: string;
    }) {
        return apiRequest<{ ticket: unknown }>('/api/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData),
        });
    },

    /**
     * Update a ticket
     */
    async update(id: string, updates: {
        status?: string;
        priority?: string;
        priorityScore?: number;
        assignedTeam?: string;
        assignedTeamId?: string;
        assignedDepartment?: string;
        internalNotes?: Array<{
            id: string;
            timestamp: string | Date;
            author: string;
            content: string;
        }>;
        aiAssessment?: {
            severity: string;
            reason: string;
            suggestedDepartment: string;
            suggestedSkill: string;
            estimatedTime: string;
        };
    }) {
        return apiRequest<{ ticket: unknown }>(`/api/tickets/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Delete a ticket (super_admin only)
     */
    async delete(id: string) {
        return apiRequest<{ success: boolean }>(`/api/tickets/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    },
};

/**
 * AI Assessment API client
 */
export const aiApi = {
    /**
     * Request AI assessment for a ticket
     */
    async assessTicket(ticket: {
        id: string;
        type: string;
        category: string;
        description: string;
        address: string;
    }) {
        return apiRequest<{ assessment: unknown }>('/api/ai/assess-ticket', {
            method: 'POST',
            body: JSON.stringify({
                ticketId: ticket.id,
                type: ticket.type,
                category: ticket.category,
                description: ticket.description,
                address: ticket.address,
            }),
        });
    },
};
