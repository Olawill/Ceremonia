import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_APP_URL!;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/", // entire dashboard
          "/api/", // all API routes
          "/sign-in",
          "/sign-up",
          "/event/preview", // editor preview iframe
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: "https://ceremonia.app",
  };
}
