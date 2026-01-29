import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
    '/portal-select',
    '/login',
    '/portal-select/department-login',
];

// Define protected routes that require authentication
const protectedRoutes = [
    '/',
    '/dispatch',
    '/tickets',
    '/analytics',
    '/audit',
    '/admin',
    '/workforce',
    '/department',
    '/setup-users', // Protected - requires super_admin
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // SECURITY: Block setup-users page in production
    // This page creates users with potentially weak passwords
    if (pathname === '/setup-users' && process.env.NODE_ENV === 'production') {
        console.warn('[Security] Blocked access to /setup-users in production');
        return NextResponse.redirect(new URL('/portal-select', request.url));
    }

    // NOTE: We've removed the cookie-based auth check from middleware because:
    // 1. Firebase client SDK doesn't automatically set cookies
    // 2. This was causing an infinite redirect loop between / and /portal-select
    // 3. Client-side auth in auth-context.tsx handles protected route logic
    // 4. API routes use Firebase Admin SDK for server-side verification

    // Let all other routes through - client-side auth will handle redirects
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
};
