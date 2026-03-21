import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { events, rsvps, users } from "@/db/schema";

import type { Plan } from "@/lib/plans";
import { PLAN_FEATURES } from "@/lib/plans";

import { AnalyticsClient } from "./AnalyticsClient";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.plan ?? "free") as Plan;

  if (!PLAN_FEATURES[plan].analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4 text-[#D4AF3740]">✦</p>
          <h2 className="font-display text-2xl font-semibold text-[#F5F0E8] mb-2">
            Analytics — Pro Feature
          </h2>
          <p className="font-display italic font-semibold text-base text-[#F5F0E890]">
            Upgrade to Pro to see view counts, RSVP trends, and more.
          </p>
        </div>
      </div>
    );
  }

  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId));

  const eventIds = userEvents.map((w) => w.id);

  const allRsvps = eventIds.length
    ? await db.select().from(rsvps).where(inArray(rsvps.eventId, eventIds))
    : [];

  return <AnalyticsClient events={userEvents} rsvps={allRsvps} />;
}
