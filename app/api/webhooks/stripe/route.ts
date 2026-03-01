import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import type { Plan } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

import { db } from "@/db";
import { users } from "@/db/schema";

// Map Stripe product/price IDs → plan names
// Fill these in after creating products in your Stripe dashboard
const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: "starter",
  [process.env.STRIPE_PRICE_STARTER_ONCE!]: "starter",
  [process.env.STRIPE_PRICE_PRO_MONTHLY!]: "pro",
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY!]: "agency",
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
      process.env.STRIPE_WEBHOOK_SECRET!,
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
      break;
    }

    // Subscription cancelled
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) break;

      await db.update(users).set({ plan: "free" }).where(eq(users.id, userId));
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
      break;
    }
  }

  return NextResponse.json({ received: true });
}
