import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bioguide.congress.gov",
      },
      {
        protocol: "https",
        hostname: "theunitedstates.io",
      },
      {
        protocol: "https",
        hostname: "*.congress.gov",
      },
    ],
  },
};

export default nextConfig;
