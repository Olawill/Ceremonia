import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { users, weddings } from "@/db/schema";

import { WeddingEngine } from "@/components/WeddingEngine";
import { PasswordGate } from "@/components/wedding/PasswordGate";

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

  // Demo slug
  if (slug === "demo") {
    return {
      title: "Taiwo & Tayo — Wedding Invitation",
      description: "Join us as we celebrate our love. 12 July 2026.",
      robots: { index: false, follow: false },
    };
  }

  const [wedding] = await db
    .select({
      bride: weddings.bride,
      groom: weddings.groom,
      date: weddings.date,
      heroPhotoUrl: weddings.heroPhotoUrl,
      slug: weddings.slug,
    })
    .from(weddings)
    .where(eq(weddings.slug, slug))
    .limit(1);

  if (!wedding) {
    return {
      title: "Wedding Invitation",
      robots: { index: false, follow: false },
    };
  }

  const title = `${wedding.bride} & ${wedding.groom} — Wedding Invitation`;
  const formattedDate = wedding.date
    ? new Date(wedding.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const description = formattedDate
    ? `You're invited to celebrate the wedding of ${wedding.bride} & ${wedding.groom} on ${formattedDate}.`
    : `You're invited to celebrate the wedding of ${wedding.bride} & ${wedding.groom}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(wedding.heroPhotoUrl && {
        images: [
          { url: wedding.heroPhotoUrl, width: 1200, height: 630, alt: title },
        ],
      }),
    },
    twitter: {
      card: wedding.heroPhotoUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(wedding.heroPhotoUrl && { images: [wedding.heroPhotoUrl] }),
    },
    // Don't index password-protected or unpublished invitations
    robots: { index: true, follow: false },
  };
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
        .select({ plan: users.plan, brandName: users.brandName })
        .from(users)
        .where(eq(users.id, wedding.userId))
        .limit(1)
    : [{ plan: "free", brandName: null }];

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
    password: wedding.password ?? undefined,
    notificationEmail: wedding.notificationEmail ?? undefined,
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

  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get(`wedding-${slug}-unlocked`)?.value === "1";

  const isPasswordProtected = wedding.passwordProtected && !!wedding.password;
  const requiresGate = isPasswordProtected && !isUnlocked;

  if (requiresGate) {
    return <PasswordGate slug={slug} />;
  }

  return (
    <WeddingEngine
      config={config}
      showWatermark={showWatermark}
      brandName={owner?.brandName ?? undefined}
    />
  );
}
