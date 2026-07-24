import { db } from "@/db";
import { roomsCredits } from "@/db/schema";
import {
  ROOMS_CREDITS_AGENCY_MONTHLY_FREE,
  ROOMS_CREDITS_RESET_DAYS,
} from "@/lib/plans";
import { and, eq } from "drizzle-orm";

export interface ConsumeResult {
  success: boolean;
  freeRemaining: number;
  purchasedRemaining: number;
  totalRemaining: number;
}

/**
 * Consumes one room credit for the given user.
 * Free credits are consumed first (Agency monthly allowance), then purchased.
 * Returns the updated balance.
 * Throws if no credits are available.
 */
export async function consumeRoomCredit(
  userId: string,
  plan: string,
): Promise<ConsumeResult> {
  const isAgency = plan === "agency";

  // Optimistic-concurrency loop: the UPDATE is guarded on the used-counters we
  // read, so two concurrent consumes can't both spend the same credit. On a
  // lost race we re-read and retry.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = new Date();

    // ── Fetch existing row ──────────────────────────────────────────
    const rows = await db
      .select()
      .from(roomsCredits)
      .where(eq(roomsCredits.userId, userId))
      .limit(1);

    let row = rows[0];

    // ── No row: create one with 0 credits unless they're agency ─────
    if (!row) {
      const [created] = await db
        .insert(roomsCredits)
        .values({
          userId,
          freeCreditsTotal: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
          freeCreditsUsed: 0,
          purchasedCreditsTotal: 0,
          purchasedCreditsUsed: 0,
          periodStart: now,
        })
        .returning();
      row = created;
    }

    // ── Apply monthly reset if needed ───────────────────────────────
    const periodStart = row.periodStart
      ? new Date(row.periodStart)
      : new Date(0);
    const daysSincePeriodStart =
      (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const periodExpired = daysSincePeriodStart >= ROOMS_CREDITS_RESET_DAYS;

    let freeTotal = periodExpired
      ? isAgency
        ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE
        : 0
      : row.freeCreditsTotal;
    const freeUsed = periodExpired ? 0 : row.freeCreditsUsed;

    // ── Agency mid-period top-up ───────────────────────────────────
    if (
      isAgency &&
      !periodExpired &&
      freeTotal < ROOMS_CREDITS_AGENCY_MONTHLY_FREE
    ) {
      freeTotal = ROOMS_CREDITS_AGENCY_MONTHLY_FREE;
    }

    const freeRemaining = freeTotal - freeUsed;
    const purchasedRemaining =
      row.purchasedCreditsTotal - row.purchasedCreditsUsed;

    // ── Check balance ──────────────────────────────────────────────
    if (freeRemaining <= 0 && purchasedRemaining <= 0) {
      throw new Error("NO_CREDITS");
    }

    // ── Consume one credit (free first, then purchased) ───────────
    const newFreeUsed = freeRemaining > 0 ? freeUsed + 1 : freeUsed;
    const newPurchasedUsed =
      freeRemaining > 0
        ? row.purchasedCreditsUsed
        : row.purchasedCreditsUsed + 1;

    const updated = await db
      .update(roomsCredits)
      .set({
        freeCreditsTotal: freeTotal,
        freeCreditsUsed: newFreeUsed,
        purchasedCreditsUsed: newPurchasedUsed,
        // Reset period if it just expired
        ...(periodExpired ? { periodStart: now } : {}),
      })
      .where(
        and(
          eq(roomsCredits.userId, userId),
          eq(roomsCredits.freeCreditsUsed, row.freeCreditsUsed),
          eq(roomsCredits.purchasedCreditsUsed, row.purchasedCreditsUsed),
        ),
      )
      .returning();

    if (updated.length === 0) continue; // lost the race — re-read and retry

    const newFreeRemaining = freeTotal - newFreeUsed;
    const newPurchasedRemaining = row.purchasedCreditsTotal - newPurchasedUsed;

    return {
      success: true,
      freeRemaining: Math.max(0, newFreeRemaining),
      purchasedRemaining: Math.max(0, newPurchasedRemaining),
      totalRemaining:
        Math.max(0, newFreeRemaining) + Math.max(0, newPurchasedRemaining),
    };
  }

  throw new Error("CREDIT_CONFLICT");
}

/**
 * Returns current credit balance without consuming.
 */
export async function getRoomCreditBalance(userId: string, plan: string) {
  const isAgency = plan === "agency";
  const now = new Date();

  const rows = await db
    .select()
    .from(roomsCredits)
    .where(eq(roomsCredits.userId, userId))
    .limit(1);

  if (!rows.length) {
    return {
      free: {
        total: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
        used: 0,
        remaining: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
      },
      purchased: { total: 0, used: 0, remaining: 0 },
      totalRemaining: isAgency ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0,
      periodStart: now,
    };
  }

  const row = rows[0];
  const periodStart = row.periodStart ? new Date(row.periodStart) : new Date(0);
  const daysSincePeriodStart =
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const periodExpired = daysSincePeriodStart >= ROOMS_CREDITS_RESET_DAYS;

  const freeTotal = periodExpired
    ? isAgency
      ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE
      : 0
    : row.freeCreditsTotal;
  const freeUsed = periodExpired ? 0 : row.freeCreditsUsed;

  const freeRemaining = Math.max(0, freeTotal - freeUsed);
  const purchasedRemaining = Math.max(
    0,
    row.purchasedCreditsTotal - row.purchasedCreditsUsed,
  );

  return {
    free: { total: freeTotal, used: freeUsed, remaining: freeRemaining },
    purchased: {
      total: row.purchasedCreditsTotal,
      used: row.purchasedCreditsUsed,
      remaining: purchasedRemaining,
    },
    totalRemaining: freeRemaining + purchasedRemaining,
    // The period the free allowance belongs to. If the stored period has
    // expired, a fresh period effectively starts now.
    periodStart: periodExpired ? now : periodStart,
  };
}
