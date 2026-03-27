import { db } from "@/db";
import { roomsCredits, users } from "@/db/schema";
import { env } from "@/env";
import {
  ROOMS_CREDITS_AGENCY_MONTHLY_FREE,
  ROOMS_CREDITS_RESET_DAYS,
} from "@/lib/plans";
import { polar } from "@/lib/polar";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { getAuthUserId } from "../auth";

// ── Helper: get-or-create credits row, applying monthly reset if needed ──────
async function getCreditsRow(userId: string, plan: string) {
  const isAgency = plan === "agency";
  const existing = await db
    .select()
    .from(roomsCredits)
    .where(eq(roomsCredits.userId, userId))
    .limit(1);

  // ── New user: create their row ──
  if (!existing.length) {
    const [row] = await db
      .insert(roomsCredits)
      .values({
        userId,
        freeCreditsTotal: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
        freeCreditsUsed: 0,
        purchasedCreditsTotal: 0,
        purchasedCreditsUsed: 0,
        periodStart: new Date(),
      })
      .returning();
    return row;
  }

  const row = existing[0];
  const now = new Date();
  const periodStart = row.periodStart ? new Date(row.periodStart) : new Date(0);
  const daysSincePeriodStart =
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

  // ── Monthly reset: period expired ──
  // Free credits reset to the plan allowance (no rollover).
  // Purchased credits are untouched.
  if (daysSincePeriodStart >= ROOMS_CREDITS_RESET_DAYS) {
    const [updated] = await db
      .update(roomsCredits)
      .set({
        freeCreditsTotal: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
        freeCreditsUsed: 0,
        periodStart: now,
      })
      .where(eq(roomsCredits.userId, userId))
      .returning();
    return updated;
  }

  // ── Agency upgraded mid-period: ensure they have at least the free allowance ──
  // This handles the case where a user upgrades to Agency and their row
  // already exists from when they were on another plan (0 free credits).
  if (isAgency && row.freeCreditsTotal < ROOMS_CREDITS_AGENCY_MONTHLY_FREE) {
    const [updated] = await db
      .update(roomsCredits)
      .set({ freeCreditsTotal: ROOMS_CREDITS_AGENCY_MONTHLY_FREE })
      .where(eq(roomsCredits.userId, userId))
      .returning();
    return updated;
  }

  return row;
}

export const roomsRouter = new Elysia({ prefix: "/rooms" })
  .use(bearer())

  // GET /api/rooms/credits — returns current credit balance for the user
  .get("/credits", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return status(404, { message: "User not found" });

    const row = await getCreditsRow(userId, user.plan ?? "free");

    const freeRemaining = row.freeCreditsTotal - row.freeCreditsUsed;
    const purchasedRemaining =
      row.purchasedCreditsTotal - row.purchasedCreditsUsed;

    // Period resets in X days
    const periodStart = row.periodStart
      ? new Date(row.periodStart)
      : new Date();
    const periodEnds = new Date(periodStart);
    periodEnds.setDate(periodEnds.getDate() + ROOMS_CREDITS_RESET_DAYS);

    return {
      // Legacy fields kept for DesignPanel compatibility
      total: row.freeCreditsTotal + row.purchasedCreditsTotal,
      used: row.freeCreditsUsed + row.purchasedCreditsUsed,
      // Detailed breakdown
      free: {
        total: row.freeCreditsTotal,
        used: row.freeCreditsUsed,
        remaining: Math.max(0, freeRemaining),
        resetsAt: periodEnds.toISOString(),
      },
      purchased: {
        total: row.purchasedCreditsTotal,
        used: row.purchasedCreditsUsed,
        remaining: Math.max(0, purchasedRemaining),
      },
      totalRemaining:
        Math.max(0, freeRemaining) + Math.max(0, purchasedRemaining),
    };
  })

  // POST /api/rooms/credits/checkout — creates a Polar checkout for a credit pack
  .post("/credits/checkout", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const session = await polar.checkouts.create({
      products: [env.NEXT_PUBLIC_POLAR_PRODUCT_ROOMS_CREDITS],
      externalCustomerId: userId,
      customerEmail: user?.email ?? undefined,
      successUrl: `${env.NEXT_PUBLIC_APP_URL}/app/billing?success=true&addOn=rooms`,
      metadata: { userId, addOn: "rooms_credits" },
      embedOrigin: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
    });

    return { url: session.url };
  });
