import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  basePath: '/surepoint-frontend',
  assetPrefix: '/surepoint-frontend',
  images: {
    unoptimized: true,
    formats: ['image/webp'],
  },
};

export default nextConfig;
