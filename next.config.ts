import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/surepoint-frontend',
  assetPrefix: '/surepoint-frontend',
  images: {
    unoptimized: true,
    formats: ['image/webp'],
  },
};

export default nextConfig;
