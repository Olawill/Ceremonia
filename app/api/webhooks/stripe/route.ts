import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getPostHogClient } from "@/lib/posthog-server";

import type { Plan } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";

// Map Stripe product/price IDs → plan names
// Fill these in after creating products in your Stripe dashboard
const PRICE_TO_PLAN: Record<string, Plan> = {
  [env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY!]: "starter",
  [env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ONCE!]: "starter",
  [env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!]: "pro",
  [env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY!]: "agency",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // Subscription created or updated
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";

      await db
        .update(users)
        .set({
          plan,
          stripeCustomerId: sub.customer as string,
        })
        .where(eq(users.id, userId));

      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan },
      });

      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: userId,
        event: "subscription_created",
        properties: { plan, price_id: priceId, stripe_customer_id: sub.customer },
      });
      await posthog.shutdown();
      break;
    }

    // Subscription cancelled
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) break;

      await db.update(users).set({ plan: "free" }).where(eq(users.id, userId));

      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan: "free" },
      });

      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: userId,
        event: "subscription_cancelled",
        properties: { stripe_customer_id: sub.customer },
      });
      await posthog.shutdown();
      break;
    }

    // One-time payment completed (Starter once-off)
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment") break;

      const userId = session.metadata?.userId;
      if (!userId) break;

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
      );
      const priceId = lineItems.data[0]?.price?.id;
      const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";

      await db
        .update(users)
        .set({
          plan,
          stripeCustomerId: session.customer as string,
        })
        .where(eq(users.id, userId));

      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { plan },
      });

      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: userId,
        event: "payment_completed",
        properties: { plan, price_id: priceId, amount_total: session.amount_total, currency: session.currency },
      });
      await posthog.shutdown();
      break;
    }
  }

  return NextResponse.json({ received: true });
}
