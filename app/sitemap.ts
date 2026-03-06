import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { db } from "@/db";
import { weddings } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = "https://ceremonia.app";

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
  ];

  // Published wedding pages — these are the main SEO value
  const publishedWeddings = await db
    .select({
      slug: weddings.slug,
      updatedAt: weddings.createdAt,
      passwordProtected: weddings.passwordProtected,
    })
    .from(weddings)
    .where(eq(weddings.published, true));

  const weddingRoutes: MetadataRoute.Sitemap = publishedWeddings
    // Exclude password-protected invitations — they're private
    .filter((w) => !w.passwordProtected)
    .map((w) => ({
      url: `${BASE}/wedding/${w.slug}`,
      lastModified: w.updatedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...weddingRoutes];
}
