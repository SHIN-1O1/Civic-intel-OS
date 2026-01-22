import { Ticket } from "@/lib/types";
import { getAuth } from "firebase/auth";

/**
 * SECURITY: This service now calls the server-side API route instead of
 * calling the Gemini API directly. The API key is only accessed server-side.
 */

export class GeminiService {
    /**
     * Assess a ticket using AI via the secure server-side API
     * @param ticket - The ticket to assess
     * @returns AI assessment or null if failed
     */
    async assessTicket(ticket: Ticket): Promise<Partial<Ticket['aiAssessment']> | null> {
        try {
            // Get the current user's ID token for authentication
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.warn("[Gemini] No authenticated user - cannot call AI assessment API");
                return this.getDefaultAssessment(ticket, "User not authenticated");
            }

            const idToken = await user.getIdToken();

            // Call the secure server-side API route
            const response = await fetch('/api/ai/assess-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    ticketId: ticket.id,
                    type: ticket.type,
                    category: ticket.category,
                    description: ticket.description,
                    address: ticket.location.address,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle specific error cases
                if (response.status === 401) {
                    console.warn("[Gemini] Authentication failed");
                    return this.getDefaultAssessment(ticket, "Authentication failed");
                }
                if (response.status === 403) {
                    console.warn("[Gemini] Insufficient permissions for AI assessment");
                    return this.getDefaultAssessment(ticket, "Insufficient permissions");
                }
                if (response.status === 429) {
                    console.warn("[Gemini] Rate limit exceeded");
                    return this.getDefaultAssessment(ticket, "Rate limit exceeded - try again later");
                }

                console.error("[Gemini] API error:", errorData.error || response.statusText);
                return this.getDefaultAssessment(ticket, "AI Service Error");
            }

            const data = await response.json();
            return data.assessment;

        } catch (error) {
            console.error("[Gemini] Assessment failed:", error);
            return this.getDefaultAssessment(ticket, "AI Assessment Failed");
        }
    }

    /**
     * Returns a default assessment when the AI service is unavailable
     */
    private getDefaultAssessment(
        ticket: Ticket,
        reason: string
    ): Partial<Ticket['aiAssessment']> {
        return {
            severity: "Medium",
            reason: reason,
            suggestedDepartment: ticket.category || "General",
            suggestedSkill: "General Labor",
            estimatedTime: "24 hours"
        };
    }
}

export const geminiService = new GeminiService();

