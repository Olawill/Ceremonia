import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { events, rsvps, users } from "@/db/schema";

import type { Plan } from "@/lib/plans";
import { PLAN_FEATURES } from "@/lib/plans";

import { RSVPsClient } from "./RSVPsClient";

export const metadata = { title: "RSVPs" };

export default async function RSVPsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Get user plan
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.plan ?? "free") as Plan;

  // Get all events owned by user
  const userEvents = await db
    .select({
      id: events.id,
      bride: events.bride,
      groom: events.groom,
      slug: events.slug,
      eventType: events.eventType,
    })
    .from(events)
    .where(eq(events.userId, userId));

  // Get all RSVPs for those events
  const eventIds = userEvents.map((w) => w.id);
  const allRsvps = eventIds.length
    ? await db
        .select()
        .from(rsvps)
        .where(inArray(rsvps.eventId, eventIds))
        .orderBy(rsvps.createdAt)
    : [];

  // For multiple events, fetch all and merge
  const rsvpsByEvent: Record<string, typeof allRsvps> = {};
  for (const w of userEvents) {
    rsvpsByEvent[w.id] = allRsvps.filter((r) => r.eventId === w.id);
  }

  return (
    <RSVPsClient
      events={userEvents}
      rsvpsByEvent={rsvpsByEvent}
      plan={plan}
      canExport={PLAN_FEATURES[plan].csvExport}
    />
  );
}
