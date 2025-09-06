import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable OnPrem network access
  experimental: {
    serverActions: {
      allowedOrigins: ["*"], // Allow all origins for local network
    },
  },

  // Disable strict mode for production deployment
  reactStrictMode: false,

  // Enable image optimization for network access
  images: {
    unoptimized: true,
  },

  // Headers for CORS (if needed)
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  // Output for deployment
  output: "standalone",

  // Environment variables
  env: {
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
    PORT: process.env.PORT || "3002",
  },
};

export default nextConfig;
