import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://sandbox.api-flexboard.fittcoreai.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
