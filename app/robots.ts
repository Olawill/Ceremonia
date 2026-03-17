import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: "https://ceremonia.app/sitemap.xml",
    host: "https://ceremonia.app",
  };
}
