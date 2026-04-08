import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { db } from "@/db";

import {
  EditorShell,
  EditorSkeleton,
} from "@/components/dashboard/editor/EditorShell";

import { events } from "@/db/schema";
import type {
  AccommodationConfig,
  Course,
  CurtainStyle,
  DressCodeConfig,
  EventConfig,
  EventPartyMember,
  FaqItem,
  TimelineEvent,
  TravelItem,
  VenueEvent,
} from "@/types/event";
import { DEMO_EVENT_CONFIG, EventType, getVocabulary } from "@/types/event";
import type { EventTheme, ThemeKey } from "@/types/theme";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "new") return { title: "New Event" };

  const [event] = await db
    .select({
      bride: events.bride,
      groom: events.groom,
      eventType: events.eventType,
    })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event) return { title: "Editor" };
  const vocab = getVocabulary((event.eventType as EventType) ?? "wedding");
  const hostsStr = event.groom
    ? `${event.bride} & ${event.groom}`
    : event.bride;
  return { title: `Editing ${hostsStr} — ${vocab.eventLabel}` };
}

export default async function EditorPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;

  // "new" slug → pass empty config, EditorShell handles creation
  if (slug === "new") {
    return (
      <Suspense fallback={<EditorSkeleton />}>
        <EditorShell initialConfig={null} isNew />
      </Suspense>
    );
  }

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.userId, userId)))
    .limit(1);

  if (!event) notFound();

  const config: EventConfig = {
    id: event.id,
    slug: event.slug,
    eventType: (event.eventType as EventType) ?? "wedding",
    bride: event.bride,
    groom: event.groom ?? "",
    tagLine: event.tagLine ?? undefined,
    date: event.date,
    venueDetails:
      (event.venueDetails as VenueEvent[]) ?? DEMO_EVENT_CONFIG.venueDetails,
    themeKey: (event.themeKey as ThemeKey) ?? "royal",
    customTheme: event.customTheme as EventTheme | undefined,
    curtainStyle: (event.curtainStyle as CurtainStyle) ?? "velvet",
    audioUrl: event.audioUrl ?? undefined,
    heroPhotoUrl: event.heroPhotoUrl ?? undefined,
    guestBookEnabled: event.guestBookEnabled ?? false,
    timeline: (event.timeline as TimelineEvent[]) ?? [],
    menuCourses: (event.menuCourses as Course[]) ?? [],
    rsvpEnabled: event.rsvpEnabled ?? true,
    rsvpDeadline: event.rsvpDeadline ?? undefined,
    published: event.published ?? false,
    passwordProtected: event.passwordProtected ?? false,
    dressCodeEnabled: event.dressCodeEnabled ?? false,
    dressCode: event.dressCode as DressCodeConfig | undefined,
    accommodationEnabled: event.accommodationEnabled ?? false,
    accommodation: event.accommodation as AccommodationConfig | undefined,
    eventPartyEnabled: event.eventPartyEnabled ?? false,
    eventParty: event.eventParty as EventPartyMember[] | undefined,
    faqEnabled: event.faqEnabled ?? false,
    faq: event.faq as FaqItem[] | undefined,
    livestreamEnabled: event.livestreamEnabled ?? false,
    livestreamUrl: event.livestreamUrl ?? undefined,
    livestreamTitle: event.livestreamTitle ?? undefined,
    livestreamNote: event.livestreamNote ?? undefined,
    livestreamTime: event.livestreamTime ?? undefined,
    photoGalleryEnabled: event.photoGalleryEnabled ?? false,
    galleryPhotos: (event.galleryPhotos as string[]) ?? [],
    travelGuideEnabled: event.travelGuideEnabled ?? false,
    travelItems: (event.travelItems as TravelItem[]) ?? [],
  };

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorShell initialConfig={config} isNew={false} />
    </Suspense>
  );
}
