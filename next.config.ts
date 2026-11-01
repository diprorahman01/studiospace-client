
import type { NextConfig } from "next";

const apiServerUrl = (
  process.env.API_SERVER_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,
  partialPrefetching: true,

  async rewrites() {
    return [
      {
        source: "/api/studios",
        destination: `${apiServerUrl}/api/studios`,
      },
      {
        source: "/api/studios/:path*",
        destination: `${apiServerUrl}/api/studios/:path*`,
      },
      {
        source: "/api/bookings",
        destination: `${apiServerUrl}/api/bookings`,
      },
      {
        source: "/api/bookings/:path*",
        destination: `${apiServerUrl}/api/bookings/:path*`,
      },
      {
        source: "/api/host/:path*",
        destination: `${apiServerUrl}/api/host/:path*`,
      },
      {
        source: "/api/health",
        destination: `${apiServerUrl}/api/health`,
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
