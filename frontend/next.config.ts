import type { NextConfig } from "next";

// Backend URL for API rewrites
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  poweredByHeader: false,
  reactStrictMode: true,

  // Allowed origins for development
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '*.replit.dev',
    '*.sisko.replit.dev',
    '*.vercel.app',
  ],

  devIndicators: false,

  // API rewrites to backend (local dev only — in production the platform routes /api/* directly)
  async rewrites() {
    if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

export default nextConfig;