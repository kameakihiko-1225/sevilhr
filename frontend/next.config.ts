import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '*.replit.dev',
    '*.sisko.replit.dev',
  ],
  devIndicators: false,
  async rewrites() {
    // Use BACKEND_URL environment variable for Docker compatibility
    // In Docker: http://backend:3001 (service name on Docker network)
    // In local dev: http://localhost:3001
    // Fallback to localhost for backward compatibility
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
