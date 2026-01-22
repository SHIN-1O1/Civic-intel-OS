import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers for production hardening
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy - restrict resource loading
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-eval and unsafe-inline for development
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // Allow images from Firebase Storage, Google APIs, and OpenStreetMap
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.firebasestorage.app https://*.tile.openstreetmap.org",
              "font-src 'self' https://fonts.gstatic.com",
              // Allow connections to Firebase and other required services
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.tile.openstreetmap.org https://firestore.googleapis.com",
              // Prevent framing (clickjacking protection)
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          // Enable XSS filter
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent DNS prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Stricter CSP for API routes (no inline scripts needed)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none'",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;

