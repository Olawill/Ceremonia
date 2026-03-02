import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";

type ClerkWebhookEvent =
  | {
      type: "user.created";
      data: {
        id: string;
        email_addresses: { email_address: string; id: string }[];
        primary_email_address_id: string;
      };
    }
  | {
      type: "user.deleted";
      data: {
        id: string;
        deleted: boolean;
      };
    };

export async function POST(req: NextRequest) {
  const webhookSecret = env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook secret" },
      { status: 500 },
    );
  }

  // Verify the webhook signature using svix
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const {
        id: clerkUserId,
        email_addresses,
        primary_email_address_id,
      } = event.data;

      const primaryEmail = email_addresses.find(
        (e) => e.id === primary_email_address_id,
      )?.email_address;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "No primary email" },
          { status: 400 },
        );
      }

      // Idempotency guard — webhooks can fire more than once
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, clerkUserId))
        .limit(1);

      if (existing) {
        return NextResponse.json({ received: true });
      }

      // Create Stripe customer first so we always have a customerId
      const stripeCustomer = await stripe.customers.create({
        email: primaryEmail,
        metadata: { clerkUserId },
      });

      await db.insert(users).values({
        id: clerkUserId,
        email: primaryEmail,
        stripeCustomerId: stripeCustomer.id,
        plan: "free",
      });

      // Sync free plan to Clerk publicMetadata so usePlan() works immediately
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { plan: "free" },
      });

      break;
    }

    case "user.deleted": {
      const { id: clerkUserId } = event.data;
      if (!clerkUserId) break;

      // Look up their Stripe customer ID before deleting the row
      const [user] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, clerkUserId))
        .limit(1);

      // Cancel any active Stripe subscriptions and delete the customer
      if (user?.stripeCustomerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: "active",
        });

        await Promise.all(
          subscriptions.data.map((sub) => stripe.subscriptions.cancel(sub.id)),
        );

        await stripe.customers.del(user.stripeCustomerId);
      }

      // Delete user row (cascade will clean up weddings + rsvps if you add cascade to the schema)
      await db.delete(users).where(eq(users.id, clerkUserId));

      break;
    }
  }

  return NextResponse.json({ received: true });
}
