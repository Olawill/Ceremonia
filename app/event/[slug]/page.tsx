import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { events, users } from "@/db/schema";

import { EventEngine } from "@/components/EventEngine";
import { PasswordGate } from "@/components/event/PasswordGate";

import { EventExpiredPage } from "@/components/event/EventExpiredPage";
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

  // Demo slug
  if (slug === "demo") {
    return {
      title: "Taiwo & Tayo — Wedding Invitation",
      description: "Join us as we celebrate our love. 12 July 2026.",
      robots: { index: false, follow: false },
    };
  }

  const [event] = await db
    .select({
      bride: events.bride,
      groom: events.groom,
      date: events.date,
      heroPhotoUrl: events.heroPhotoUrl,
      slug: events.slug,
      eventType: events.eventType,
    })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event) {
    return {
      title: "Event Invitation",
      robots: { index: false, follow: false },
    };
  }

  const vocab = getVocabulary((event.eventType as EventType) ?? "wedding");
  const hostsStr = event.groom
    ? `${event.bride} & ${event.groom}`
    : event.bride;
  const title = `${hostsStr} — ${vocab.eventLabel} Invitation`;

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const description = formattedDate
    ? `You're invited to celebrate the ${vocab.eventLabel.toLowerCase()} of ${hostsStr} on ${formattedDate}.`
    : `You're invited to celebrate the ${vocab.eventLabel.toLowerCase()} of ${hostsStr}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(event.heroPhotoUrl && {
        images: [
          { url: event.heroPhotoUrl, width: 1200, height: 630, alt: title },
        ],
      }),
    },
    twitter: {
      card: event.heroPhotoUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(event.heroPhotoUrl && { images: [event.heroPhotoUrl] }),
    },
    // Don't index password-protected or unpublished invitations
    robots: { index: true, follow: false },
  };
}

// Next.js 15 — generateStaticParams for known events (ISR)
export async function generateStaticParams() {
  const allEvents = await db
    .select({ slug: events.slug })
    .from(events)
    .where(
      and(
        eq(events.published, true),
        or(isNull(events.expiresAt), gt(events.expiresAt, new Date())),
      ),
    );

  const slugs = allEvents.map((w) => ({ slug: w.slug }));

  // Always pre-render the demo slug — it bypasses DB and serves DEMO_EVENT_CONFIG
  if (!slugs.find((s) => s.slug === "demo")) {
    slugs.push({ slug: "demo" });
  }

  return slugs;
}

// Revalidate every 60 seconds — keeps it fast but fresh
export const revalidate = 60;

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  // Demo slug for development
  if (slug === "demo") {
    return <EventEngine config={DEMO_EVENT_CONFIG} />;
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event || !event.published) {
    notFound();
  }

  // Check expiry — expiresAt is null for active subscriptions (never expires)
  if (event.expiresAt && new Date() > new Date(event.expiresAt)) {
    // Don't 404 — render a dedicated expired page so the owner
    // understands what happened and can upgrade
    return <EventExpiredPage expiresAt={new Date(event.expiresAt)} />;
  }

  const [owner] = event.userId
    ? await db
        .select({ plan: users.plan, brandName: users.brandName })
        .from(users)
        .where(eq(users.id, event.userId))
        .limit(1)
    : [{ plan: "free", brandName: null }];

  const showWatermark = (owner?.plan ?? "free") === "free";

  // Increment view count (fire-and-forget, don't await)
  db.update(events)
    .set({ viewCount: sql`COALESCE(${events.viewCount}, 0) + 1` })
    .where(eq(events.id, event.id))
    .execute()
    .catch(console.error);

  // Map DB row → EventConfig (the bridge between DB and UI)
  const config: EventConfig = {
    id: event.id,
    slug: event.slug,
    eventType: (event.eventType as EventType) ?? "wedding",
    bride: event.bride,
    groom: event.groom ?? "",
    date: event.date,
    tagLine: event.tagLine ?? undefined,
    finaleTagLine: event.finaleTagLine ?? undefined,
    venueDetails: (event.venueDetails as VenueEvent[]) ?? [
      { label: "Ceremony", value: "TBD", sub: "" },
      { label: "Reception", value: "TBD", sub: "" },
      { label: "Location", value: "TBD", sub: "" },
    ],
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
    password: event.password ?? undefined,
    notificationEmail: event.notificationEmail ?? undefined,
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
    photoGalleryEnabled: event.photoGalleryEnabled ?? false,
    galleryPhotos: (event.galleryPhotos as string[]) ?? [],
    travelGuideEnabled: event.travelGuideEnabled ?? false,
    travelItems: (event.travelItems as TravelItem[]) ?? [],
  };

  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get(`event-${slug}-unlocked`)?.value === "1";

  const isPasswordProtected = event.passwordProtected && !!event.password;
  const requiresGate = isPasswordProtected && !isUnlocked;

  if (requiresGate) {
    return <PasswordGate slug={slug} />;
  }

  return (
    <EventEngine
      config={config}
      showWatermark={showWatermark}
      brandName={owner?.brandName ?? undefined}
    />
  );
}
