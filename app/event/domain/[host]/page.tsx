import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { events } from "@/db/schema";
import { EventType, getVocabulary } from "@/types/event";

interface Props {
  params: Promise<{ host: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const [event] = await db
    .select({
      bride: events.bride,
      groom: events.groom,
      eventType: events.eventType,
    })
    .from(events)
    .where(eq(events.customDomain, host))
    .limit(1);

  if (!event) return { title: "Event Invitation" };
  const vocab = getVocabulary((event.eventType as EventType) ?? "wedding");
  const hostsStr = event.groom
    ? `${event.bride} & ${event.groom}`
    : event.bride;
  return {
    title: `${hostsStr} — ${vocab.eventLabel} Invitation`,
    robots: { index: true, follow: false },
  };
}

export default async function CustomDomainPage({ params }: Props) {
  const { host } = await params;

  const [event] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.customDomain, host))
    .limit(1);

  if (!event) notFound();

  // Redirect to the slug route which has all the rendering logic
  redirect(`/event/${event.slug}`);
}
