import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
