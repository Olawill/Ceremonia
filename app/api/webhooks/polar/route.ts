import { clerkClient } from "@clerk/nextjs/server";
import { Webhooks } from "@polar-sh/nextjs";
import { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roomsCredits, users } from "@/db/schema";
import { env } from "@/env";

import {
  Plan,
  ROOMS_CREDITS_AGENCY_MONTHLY_FREE,
  ROOMS_CREDITS_PER_PACK,
  STARTER_ONCE_HOSTING_DAYS,
} from "@/lib/plans";
import { getPostHogClient } from "@/lib/posthog-server";

// Map Polar product IDs → plan names
const PRODUCT_TO_PLAN: Record<string, Plan> = {
  [env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY!]: "starter",
  [env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE!]: "starter",
  [env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY!]: "pro",
  [env.NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY!]: "agency",
};

// One-time product IDs (need expiry logic)
const ONE_TIME_PRODUCTS = new Set([
  env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE!,
]);

async function syncUserFromState(
  externalId: string, // this is the Clerk userId
  polarCustomerId: string,
  activeSubscriptions: CustomerStateSubscription[],
  orders: Array<{ product: { id: string }; createdAt: string }>,
) {
  let plan: Plan = "free";
  let starterIsOnce = false;

  // Derive plan from active subscriptions first (subscriptions take priority)
  for (const sub of activeSubscriptions) {
    const mapped = PRODUCT_TO_PLAN[sub.productId];
    if (mapped && mapped !== "free") {
      plan = mapped;
      // Any active subscription means the user is NOT a one-time purchaser
      starterIsOnce = false;
      break;
    }
  }

  // If no active subscription, check for valid one-time purchases
  let starterExpiresAt: Date | null = null;
  if (plan === "free") {
    for (const order of orders) {
      if (ONE_TIME_PRODUCTS.has(order.product.id)) {
        const purchasedAt = new Date(order.createdAt);
        const expiresAt = new Date(purchasedAt);
        expiresAt.setDate(expiresAt.getDate() + STARTER_ONCE_HOSTING_DAYS);

        if (new Date() < expiresAt) {
          plan = "starter";
          starterExpiresAt = expiresAt;
          starterIsOnce = true;
        }
        break;
      }
    }
  }

  // Write to DB
  await db
    .update(users)
    .set({ plan, polarCustomerId, starterIsOnce })
    .where(eq(users.id, externalId));

  // Sync to Clerk publicMetadata for usePlan() hook
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(externalId, {
    publicMetadata: { plan },
  });

  return plan;
}

export const POST = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET,

  onCustomerStateChanged: async (payload) => {
    const { data } = payload;

    const externalId = data.externalId;
    if (!externalId) return; // customer not linked to a Clerk user

    const plan = await syncUserFromState(
      externalId,
      data.id,
      data.activeSubscriptions ?? [],
      [], // orders not in customer.state_changed — handled via starterIsOnce on order webhooks
    );

    // If the user activated/renewed a paid subscription, reset their monthly event quota
    // so they get a fresh allocation for the new billing period
    if (plan === "starter" || plan === "pro" || plan === "agency") {
      await db
        .update(users)
        .set({
          monthlyEventsCreated: 0,
          eventPeriodStart: new Date(),
        })
        .where(eq(users.id, externalId));
    }

    // If the user just upgraded to agency, ensure their credits row exists
    // with the free monthly allowance. getCreditsRow handles the upsert logic.
    if (plan === "agency") {
      const existing = await db
        .select()
        .from(roomsCredits)
        .where(eq(roomsCredits.userId, externalId))
        .limit(1);

      if (!existing.length) {
        await db.insert(roomsCredits).values({
          userId: externalId,
          freeCreditsTotal: ROOMS_CREDITS_AGENCY_MONTHLY_FREE,
          freeCreditsUsed: 0,
          purchasedCreditsTotal: 0,
          purchasedCreditsUsed: 0,
          periodStart: new Date(),
        });
      } else if (
        existing[0].freeCreditsTotal < ROOMS_CREDITS_AGENCY_MONTHLY_FREE
      ) {
        // Existing row from a previous plan — top up the free allowance
        await db
          .update(roomsCredits)
          .set({
            freeCreditsTotal: ROOMS_CREDITS_AGENCY_MONTHLY_FREE,
            periodStart: new Date(),
          })
          .where(eq(roomsCredits.userId, externalId));
      }
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: externalId,
      event: "polar_customer_state_changed",
      properties: { plan, polar_customer_id: data.id },
    });
    await posthog.shutdown();
  },

  onOrderPaid: async (payload) => {
    const { data } = payload;
    const externalId = data.customer?.externalId;
    if (!externalId) return;

    const productId = data.product?.id;
    if (!productId || !ONE_TIME_PRODUCTS.has(productId)) return;

    // One-time Starter purchase — set plan and starterIsOnce flag
    const purchasedAt = new Date(data.createdAt);
    const expiresAt = new Date(purchasedAt);
    expiresAt.setDate(expiresAt.getDate() + STARTER_ONCE_HOSTING_DAYS);

    const isStillValid = new Date() < expiresAt;
    const plan: Plan = isStillValid ? "starter" : "free";

    await db
      .update(users)
      .set({
        plan,
        polarCustomerId: data.customer.id,
        starterIsOnce: isStillValid,
        // Reset monthly quota counters for one-time purchase
        monthlyEventsCreated: 0,
        eventPeriodStart: new Date(),
      })
      .where(eq(users.id, externalId));

    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(externalId, {
      publicMetadata: { plan },
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: externalId,
      event: "payment_completed",
      properties: { plan, polar_customer_id: data.customer.id },
    });
    await posthog.shutdown();
  },

  onOrderCreated: async (payload) => {
    const { data } = payload;
    const productId = data.product?.id;
    const externalId = data.customer?.externalId;

    if (
      productId === env.NEXT_PUBLIC_POLAR_PRODUCT_ROOMS_CREDITS &&
      externalId
    ) {
      // Add credits to the user's balance
      const existing = await db
        .select()
        .from(roomsCredits)
        .where(eq(roomsCredits.userId, externalId))
        .limit(1);

      if (existing.length) {
        await db
          .update(roomsCredits)
          .set({
            purchasedCreditsTotal:
              existing[0].purchasedCreditsTotal + ROOMS_CREDITS_PER_PACK,
          })
          .where(eq(roomsCredits.userId, externalId));
      } else {
        await db.insert(roomsCredits).values({
          userId: externalId,
          freeCreditsTotal: 0,
          freeCreditsUsed: 0,
          purchasedCreditsTotal: ROOMS_CREDITS_PER_PACK,
          purchasedCreditsUsed: 0,
          periodStart: new Date(),
        });
      }
    }
  },
});
