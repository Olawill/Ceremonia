"use server";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { db } from "@/db";
import { events } from "@/db/schema";

import { verifyPassword } from "@/lib/password";
import { getPostHogClient } from "@/lib/posthog-server";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function unlockEvent(slug: string, password: string) {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headerList.get("x-real-ip")?.trim() ??
    "unknown";

  // Passwords are the only thing standing between a guest link and a
  // password-protected event page — rate-limit attempts per IP to make
  // brute-forcing impractical.
  const rl = await consumeRateLimit(`unlock:${ip}:${slug}`, 10, 600); // 10 per 10 min
  if (!rl.allowed) {
    return { success: false, rateLimited: true };
  }

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
