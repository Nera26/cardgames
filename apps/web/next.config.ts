import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared library from the monorepo
  transpilePackages: ['@poker/shared'],
  // Enable standalone output for Docker production builds
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  // Required for Next.js 16+ when webpack config exists
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
