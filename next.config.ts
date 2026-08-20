import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["minecraft-ui"],
  experimental: {
    turbopackLocalPostcssConfig: true,
  },
};

export default nextConfig;
