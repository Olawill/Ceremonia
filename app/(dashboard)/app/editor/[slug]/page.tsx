import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { weddings } from "@/db/schema";

import { EditorShell } from "@/components/dashboard/editor/EditorShell";

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

export default async function EditorPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;

  // "new" slug → pass empty config, EditorShell handles creation
  if (slug === "new") {
    return <EditorShell initialConfig={null} isNew />;
  }

  const [wedding] = await db
    .select()
    .from(weddings)
    .where(and(eq(weddings.slug, slug), eq(weddings.userId, userId)))
    .limit(1);

  if (!wedding) notFound();

  const config: WeddingConfig = {
    id: wedding.id,
    slug: wedding.slug,
    bride: wedding.bride,
    groom: wedding.groom,
    tagLine: wedding.tagLine ?? undefined,
    date: wedding.date,
    venueDetails:
      (wedding.venueDetails as VenueEvent[]) ??
      DEMO_WEDDING_CONFIG.venueDetails,
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
  };

  return <EditorShell initialConfig={config} isNew={false} />;
}
