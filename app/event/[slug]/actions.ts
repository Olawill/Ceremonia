"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { events } from "@/db/schema";

import { verifyPassword } from "@/lib/password";
import { getPostHogClient } from "@/lib/posthog-server";

export async function unlockEvent(slug: string, password: string) {
  const [event] = await db
    .select({ password: events.password })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!event?.password || !verifyPassword(password, event.password)) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(`event-${slug}-unlocked`, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: `/event/${slug}`,
  });

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: `guest:${slug}`,
    event: "event_unlocked",
    properties: { slug },
  });
  await posthog.shutdown();

  return { success: true };
}
