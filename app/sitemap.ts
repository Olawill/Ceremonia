import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { db } from "@/db";
import { events } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXT_PUBLIC_APP_URL!;

  // Static marketing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE}/themes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Published event pages — these are the main SEO value
  const publishedEvents = await db
    .select({
      slug: events.slug,
      updatedAt: events.createdAt,
      passwordProtected: events.passwordProtected,
    })
    .from(events)
    .where(eq(events.published, true));

  const eventRoutes: MetadataRoute.Sitemap = publishedEvents
    // Exclude password-protected invitations — they're private
    .filter((w) => !w.passwordProtected)
    .map((w) => ({
      url: `${BASE}/event/${w.slug}`,
      lastModified: w.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...eventRoutes];
}
