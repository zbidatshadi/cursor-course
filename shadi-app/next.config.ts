import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configure Turbopack root to fix workspace detection
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
  async rewrites() {
    return [
      {
        source: '/validate-apikey',
        destination: '/api/validate-apikey',
      },
    ];
  },
};

export default nextConfig;
