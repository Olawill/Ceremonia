import type { NextConfig } from "next";

const NGROK_URL = process.env.NGROK_URL;
// Extract just the hostname: "legible-workable-lion.ngrok-free.app"
const NGROK_HOSTNAME = NGROK_URL ? new URL(NGROK_URL).hostname : undefined;

const nextConfig: NextConfig = {
  logging: {
    browserToTerminal: "warn",
  },
  reactStrictMode: true,
  ...(NGROK_HOSTNAME && {
    allowedDevOrigins: [NGROK_HOSTNAME],
    // assetPrefix: NGROK_URL,
  }),
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
