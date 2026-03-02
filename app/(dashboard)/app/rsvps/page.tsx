import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { rsvps, users, weddings } from "@/db/schema";

import type { Plan } from "@/lib/plans";
import { PLAN_FEATURES } from "@/lib/plans";

import { RSVPsClient } from "./RSVPsClient";

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

  // Get all weddings owned by user
  const userWeddings = await db
    .select({
      id: weddings.id,
      bride: weddings.bride,
      groom: weddings.groom,
      slug: weddings.slug,
    })
    .from(weddings)
    .where(eq(weddings.userId, userId));

  // Get all RSVPs for those weddings
  const weddingIds = userWeddings.map((w) => w.id);
  const allRsvps = weddingIds.length
    ? await db
        .select()
        .from(rsvps)
        .where(inArray(rsvps.weddingId, weddingIds))
        .orderBy(rsvps.createdAt)
    : [];

  // For multiple weddings, fetch all and merge
  const rsvpsByWedding: Record<string, typeof allRsvps> = {};
  for (const w of userWeddings) {
    rsvpsByWedding[w.id] = allRsvps.filter((r) => r.weddingId === w.id);
  }

  return (
    <RSVPsClient
      weddings={userWeddings}
      rsvpsByWedding={rsvpsByWedding}
      plan={plan}
      canExport={PLAN_FEATURES[plan].csvExport}
    />
  );
}
