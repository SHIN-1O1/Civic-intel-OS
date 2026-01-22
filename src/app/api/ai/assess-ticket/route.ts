import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyFirebaseToken, hasPermission, createAuditLog } from '@/lib/firebase-admin';
import { checkRateLimit, RATE_LIMITS, createRateLimitKey, getRateLimitHeaders } from '@/lib/rate-limiter';
import { z } from 'zod';

// Validate Gemini API key exists at startup
if (!process.env.GEMINI_API_KEY) {
    console.error('[AI] GEMINI_API_KEY not configured');
}

// Server-side only - key never exposed to client
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const model = genAI?.getGenerativeModel({ model: 'gemini-pro' });

// Request validation schema
const TicketAssessmentSchema = z.object({
    ticketId: z.string().min(1).max(100),
    type: z.string().min(1).max(100),
    category: z.string().min(1).max(100),
    description: z.string().min(1).max(5000),
    address: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
    try {
        // 1. Rate limiting
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const rateLimit = checkRateLimit(
            createRateLimitKey(clientIp, undefined, 'ai_assessment'),
            RATE_LIMITS.ai_assessment
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimit)
                }
            );
        }

        // 2. Verify Firebase ID token
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid or expired token' },
                { status: 401 }
            );
        }

        // 3. RBAC check - only super_admin and dispatcher can trigger AI assessment
        if (!hasPermission(decodedToken.role, 'ai_assess')) {
            return NextResponse.json(
                { error: 'Forbidden: Insufficient permissions for AI assessment' },
                { status: 403 }
            );
        }

        // 4. Check if Gemini is configured
        if (!model) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        // 5. Validate request body with Zod
        const body = await request.json();
        const validationResult = TicketAssessmentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation error', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // 6. Call Gemini API with structured prompt
        const prompt = `
You are an AI assistant for a government civic issue management system.
Analyze the following civic issue ticket and provide an assessment.

Issue Details:
- Type: ${validatedData.type}
- Category: ${validatedData.category}  
- Description: ${validatedData.description}
- Location: ${validatedData.address}

Provide your assessment as a JSON object with these exact keys:
{
  "severity": "Critical" | "High" | "Medium" | "Low",
  "reason": "Brief explanation of severity assessment (max 200 chars)",
  "suggestedDepartment": "Best fit city department name",
  "suggestedSkill": "Required skill/expertise for the team",
  "estimatedTime": "Estimated resolution time (e.g., '2 hours', '1 day')"
}

Return ONLY the JSON object, no additional text or markdown.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 7. Parse and validate AI response
        let assessment;
        try {
            // Clean the response to ensure it's valid JSON
            const jsonStr = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            assessment = JSON.parse(jsonStr);

            // Validate required fields
            if (!assessment.severity || !assessment.reason || !assessment.suggestedDepartment) {
                throw new Error('Missing required fields in AI response');
            }
        } catch (parseError) {
            console.error('[AI] Failed to parse AI response:', text);
            // Return a default assessment if parsing fails
            assessment = {
                severity: 'Medium',
                reason: 'AI assessment parsing failed - manual review recommended',
                suggestedDepartment: validatedData.category,
                suggestedSkill: 'General',
                estimatedTime: '24 hours'
            };
        }

        // 8. Create audit log
        await createAuditLog({
            userId: decodedToken.uid,
            userName: decodedToken.email || 'Unknown',
            action: 'ai_assessment_requested',
            targetType: 'ticket',
            targetId: validatedData.ticketId,
            newValue: assessment,
            ipAddress: clientIp,
        });

        // 9. Return assessment with rate limit headers
        return NextResponse.json(
            { assessment },
            { headers: getRateLimitHeaders(rateLimit) }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AI Assessment Error]:', errorMessage);

        // Don't expose internal errors to client
        return NextResponse.json(
            { error: 'Assessment failed. Please try again later.' },
            { status: 500 }
        );
    }
}
