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

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // SECURITY NOTE: This middleware provides basic session cookie check.
    // Full token verification happens server-side in API routes using Firebase Admin SDK.
    // The client-side Firebase SDK handles actual authentication state.
    // For protected routes, check for auth session cookie
    const authSession = request.cookies.get('__session') || request.cookies.get('firebase-auth-token');

    // If no auth cookie found, redirect to portal-select
    // The actual auth validation happens on client-side with Firebase
    // and server-side in API routes with Firebase Admin SDK
    if (!authSession) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal-select';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

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
