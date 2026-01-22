/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize text content to prevent XSS
 * Escapes HTML special characters
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
    if (typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .slice(0, maxLength);
}

/**
 * Sanitize ID strings (alphanumeric, hyphens, underscores only)
 */
export function sanitizeId(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .slice(0, maxLength);
}

/**
 * Validate and sanitize email format
 */
export function sanitizeEmail(input: string): string | null {
    if (typeof input !== 'string') {
        return null;
    }

    const email = input.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email) || email.length > 254) {
        return null;
    }

    return email;
}

/**
 * Sanitize URL to prevent javascript: protocol and XSS
 */
export function sanitizeUrl(input: string): string | null {
    if (typeof input !== 'string') {
        return null;
    }

    const url = input.trim();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return null;
        }
    }

    // Only allow http, https, and relative URLs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url.slice(0, 2048); // Max URL length
    }

    return null;
}

/**
 * Validate coordinate values
 */
export function sanitizeCoordinate(
    lat: unknown,
    lng: unknown
): { lat: number; lng: number } | null {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (
        isNaN(latNum) ||
        isNaN(lngNum) ||
        latNum < -90 ||
        latNum > 90 ||
        lngNum < -180 ||
        lngNum > 180
    ) {
        return null;
    }

    return { lat: latNum, lng: lngNum };
}

/**
 * Strip potentially dangerous keys from objects
 * Prevents prototype pollution and other injection attacks
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    allowedKeys: string[]
): Partial<T> {
    const sanitized: Partial<T> = {};

    for (const key of allowedKeys) {
        if (key in obj && !key.startsWith('__') && key !== 'constructor' && key !== 'prototype') {
            sanitized[key as keyof T] = obj[key as keyof T];
        }
    }

    return sanitized;
}

/**
 * Validate file upload metadata
 */
export function validateFileUpload(file: {
    name: string;
    type: string;
    size: number;
}): { valid: boolean; error?: string } {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_NAME_LENGTH = 100;

    if (!file.name || file.name.length > MAX_NAME_LENGTH) {
        return { valid: false, error: 'Invalid file name' };
    }

    // Check for path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid file name characters' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'File type not allowed. Use JPEG, PNG, GIF, or WebP.' };
    }

    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }

    return { valid: true };
}
