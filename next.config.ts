import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  basePath: '/surepoint_frontend/surepoint_frontend',
  assetPrefix: '/surepoint_frontend/surepoint_frontend',
  images: {
    unoptimized: true,
    formats: ['image/webp'],
  },
};

export default nextConfig;
