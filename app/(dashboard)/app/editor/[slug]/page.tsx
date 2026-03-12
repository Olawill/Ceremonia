import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { weddings } from "@/db/schema";

import { EditorShell } from "@/components/dashboard/editor/EditorShell";

import type { ThemeKey, WeddingTheme } from "@/types/theme";
import type {
  AccommodationConfig,
  Course,
  CurtainStyle,
  DressCodeConfig,
  FaqItem,
  TimelineEvent,
  VenueEvent,
  WeddingConfig,
  WeddingPartyMember,
} from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "new") return { title: "New Wedding" };

  const [wedding] = await db
    .select({ bride: weddings.bride, groom: weddings.groom })
    .from(weddings)
    .where(eq(weddings.slug, slug))
    .limit(1);

  if (!wedding) return { title: "Editor" };
  return { title: `Editing ${wedding.bride} & ${wedding.groom}` };
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
    curtainStyle: (wedding.curtainStyle as CurtainStyle) ?? "velvet",
    audioUrl: wedding.audioUrl ?? undefined,
    heroPhotoUrl: wedding.heroPhotoUrl ?? undefined,
    guestBookEnabled: wedding.guestBookEnabled ?? false,
    timeline: (wedding.timeline as TimelineEvent[]) ?? [],
    menuCourses: (wedding.menuCourses as Course[]) ?? [],
    rsvpEnabled: wedding.rsvpEnabled ?? true,
    rsvpDeadline: wedding.rsvpDeadline ?? undefined,
    published: wedding.published ?? false,
    passwordProtected: wedding.passwordProtected ?? false,
    dressCodeEnabled: wedding.dressCodeEnabled ?? false,
    dressCode: wedding.dressCode as DressCodeConfig | undefined,
    accommodationEnabled: wedding.accommodationEnabled ?? false,
    accommodation: wedding.accommodation as AccommodationConfig | undefined,
    weddingPartyEnabled: wedding.weddingPartyEnabled ?? false,
    weddingParty: wedding.weddingParty as WeddingPartyMember[] | undefined,
    faqEnabled: wedding.faqEnabled ?? false,
    faq: wedding.faq as FaqItem[] | undefined,
    livestreamEnabled: wedding.livestreamEnabled ?? false,
    livestreamUrl: wedding.livestreamUrl ?? undefined,
    livestreamTitle: wedding.livestreamTitle ?? undefined,
    livestreamNote: wedding.livestreamNote ?? undefined,
  };

  return <EditorShell initialConfig={config} isNew={false} />;
}
