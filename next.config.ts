import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
   serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
      bodySizeLimit: '2mb'
    }
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, x-api-key, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
