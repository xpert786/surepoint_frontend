import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/surepoint-frontend",
  assetPrefix: "/surepoint-frontend",
  trailingSlash: true,
  images: {
    unoptimized: true,
    formats: ["image/webp"],
  },
};

export default nextConfig;