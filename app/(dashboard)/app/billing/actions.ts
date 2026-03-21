"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Plan } from "@/lib/plans";
import { polar } from "@/lib/polar";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
import { eq } from "drizzle-orm";

/**
 * Emergency re-sync: fetches the customer's live state from Polar
 * and writes it to the DB + Clerk. Used when webhooks are suspected
 * to have been dropped (e.g. during deployment downtime).
 */
export async function syncPlanFromPolar(): Promise<{ plan: Plan }> {
  const { userId } = await auth();
  if (!userId) return { plan: "free" };

  let plan: Plan = "free";
  let starterIsOnce = false;

  try {
    const state = await polar.customers.getStateExternal({
      externalId: userId,
    });

    // Check active subscriptions first — subscriptions take priority over one-time
    for (const sub of (state.activeSubscriptions ??
      []) as CustomerStateSubscription[]) {
      if (
        sub.productId === process.env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY
      ) {
        plan = "starter";
        break;
      } else if (
        sub.productId === process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY
      ) {
        plan = "pro";
        break;
      } else if (
        sub.productId === process.env.NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY
      ) {
        plan = "agency";
        break;
      }
    }

    // Check granted benefits for one-time Starter if no active subscription found.
    // Orders aren't in the customer state payload — we infer one-time purchase
    // from the starterIsOnce flag already in the DB, so just preserve it.
    if (plan === "free") {
      const [existing] = await db
        .select({ starterIsOnce: users.starterIsOnce })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // If they were previously on a one-time starter, keep it — the onOrderPaid
      // webhook is the authoritative setter for starterIsOnce. This sync only
      // handles subscription state.
      if (existing?.starterIsOnce) {
        plan = "starter";
        starterIsOnce = true;
      }
    }
  } catch {
    // Polar API unavailable — return whatever is already in the DB
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return { plan: (user?.plan as Plan) ?? "free" };
  }

  await db
    .update(users)
    .set({ plan, starterIsOnce })
    .where(eq(users.id, userId));

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, { publicMetadata: { plan } });

  return { plan };
}
