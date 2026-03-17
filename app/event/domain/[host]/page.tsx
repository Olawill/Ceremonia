import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { weddings } from "@/db/schema";
import { EventType, getVocabulary } from "@/types/event";

interface Props {
  params: Promise<{ host: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const [wedding] = await db
    .select({
      bride: weddings.bride,
      groom: weddings.groom,
      eventType: weddings.eventType,
    })
    .from(weddings)
    .where(eq(weddings.customDomain, host))
    .limit(1);

  if (!wedding) return { title: "Event Invitation" };
  const vocab = getVocabulary((wedding.eventType as EventType) ?? "wedding");
  const hostsStr = wedding.groom
    ? `${wedding.bride} & ${wedding.groom}`
    : wedding.bride;
  return {
    title: `${hostsStr} — ${vocab.eventLabel} Invitation`,
    robots: { index: true, follow: false },
  };
}

export default async function CustomDomainPage({ params }: Props) {
  const { host } = await params;

  const [wedding] = await db
    .select({ slug: weddings.slug })
    .from(weddings)
    .where(eq(weddings.customDomain, host))
    .limit(1);

  if (!wedding) notFound();

  // Redirect to the slug route which has all the rendering logic
  redirect(`/event${wedding.slug}`);
}
