/**
 * Simple in-memory rate limiter
 * For production multi-instance deployments, use Redis or similar
 */

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const requestCounts = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

// Default rate limit configs for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    ai_assessment: { maxRequests: 10, windowMs: 60000 },      // 10 per minute
    ticket_create: { maxRequests: 30, windowMs: 60000 },      // 30 per minute
    ticket_update: { maxRequests: 60, windowMs: 60000 },      // 60 per minute
    auth: { maxRequests: 5, windowMs: 60000 },                // 5 per minute
    default: { maxRequests: 100, windowMs: 60000 },           // 100 per minute
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP + userId)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed and remaining quota
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    // First request or window expired - reset counter
    if (!record || now > record.resetTime) {
        requestCounts.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs
        };
    }

    // Check if over limit
    if (record.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: record.resetTime - now
        };
    }

    // Increment counter
    record.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - record.count,
        resetIn: record.resetTime - now
    };
}

/**
 * Create a rate limit identifier from request
 * Combines IP and optionally user ID for more precise limiting
 */
export function createRateLimitKey(
    ip: string,
    userId?: string,
    endpoint?: string
): string {
    const parts = [ip];
    if (userId) parts.push(userId);
    if (endpoint) parts.push(endpoint);
    return parts.join(':');
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
    };
}

// Cleanup old entries periodically (every minute)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of requestCounts.entries()) {
            if (now > value.resetTime) {
                requestCounts.delete(key);
            }
        }
    }, 60000);
}
