import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { users, weddings } from "@/db/schema";

import { WeddingEngine } from "@/components/WeddingEngine";

import type { ThemeKey, WeddingTheme } from "@/types/theme";
import type {
  Course,
  TimelineEvent,
  VenueEvent,
  WeddingConfig,
} from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

interface Props {
  params: Promise<{ slug: string }>;
}

// Next.js 15 — generateStaticParams for known weddings (ISR)
export async function generateStaticParams() {
  const allWeddings = await db
    .select({ slug: weddings.slug })
    .from(weddings)
    .where(eq(weddings.published, true));

  return allWeddings.map((w) => ({ slug: w.slug }));
}

// Revalidate every 60 seconds — keeps it fast but fresh
export const revalidate = 60;

export default async function WeddingPage({ params }: Props) {
  const { slug } = await params;

  // Demo slug for development
  if (slug === "demo") {
    return <WeddingEngine config={DEMO_WEDDING_CONFIG} />;
  }

  const [wedding] = await db
    .select()
    .from(weddings)
    .where(eq(weddings.slug, slug))
    .limit(1);

  if (!wedding || !wedding.published) {
    notFound();
  }

  const [owner] = wedding.userId
    ? await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, wedding.userId))
        .limit(1)
    : [{ plan: "free" }];

  const showWatermark = (owner?.plan ?? "free") === "free";

  // Increment view count (fire-and-forget, don't await)
  db.update(weddings)
    .set({ viewCount: (wedding.viewCount ?? 0) + 1 })
    .where(eq(weddings.id, wedding.id))
    .catch(console.error);

  // Map DB row → WeddingConfig (the bridge between DB and UI)
  const config: WeddingConfig = {
    id: wedding.id,
    slug: wedding.slug,
    bride: wedding.bride,
    groom: wedding.groom,
    date: wedding.date,
    tagLine: wedding.tagLine ?? undefined,
    finaleTagLine: wedding.finaleTagLine ?? undefined,
    venueDetails: (wedding.venueDetails as VenueEvent[]) ?? [
      { label: "Ceremony", value: "TBD", sub: "" },
      { label: "Reception", value: "TBD", sub: "" },
      { label: "Location", value: "TBD", sub: "" },
    ],
    themeKey: (wedding.themeKey as ThemeKey) ?? "royal",
    customTheme: wedding.customTheme as WeddingTheme | undefined,
    curtainStyle: (wedding.curtainStyle as "velvet" | "drape") ?? "velvet",
    audioUrl: wedding.audioUrl ?? undefined,
    heroPhotoUrl: wedding.heroPhotoUrl ?? undefined,
    timeline: (wedding.timeline as TimelineEvent[]) ?? [],
    menuCourses: (wedding.menuCourses as Course[]) ?? [],
    rsvpEnabled: wedding.rsvpEnabled ?? true,
    rsvpDeadline: wedding.rsvpDeadline ?? undefined,
    published: wedding.published ?? false,
    passwordProtected: wedding.passwordProtected ?? false,
    password: wedding.password ?? undefined,
    notificationEmail: wedding.notificationEmail ?? undefined,
  };

  return <WeddingEngine config={config} showWatermark={showWatermark} />;
}
