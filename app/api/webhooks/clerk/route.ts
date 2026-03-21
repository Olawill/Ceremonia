import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { polar } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const {
        id: clerkUserId,
        email_addresses,
        primary_email_address_id,
      } = evt.data;

      const primaryEmail = email_addresses.find(
        (e) => e.id === primary_email_address_id,
      )?.email_address;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "No primary email" },
          { status: 400 },
        );
      }

      // Idempotency guard
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, clerkUserId))
        .limit(1);

      if (existing) {
        return NextResponse.json({ received: true });
      }

      const existingCustomer = await polar.customers
        .getExternal({ externalId: clerkUserId })
        .catch(() => null);
      if (!existingCustomer) {
        await polar.customers.create({
          externalId: clerkUserId,
          email: primaryEmail,
          name: primaryEmail,
          metadata: { clerkUserId },
        });
      }

      await db.insert(users).values({
        id: clerkUserId,
        email: primaryEmail,
        plan: "free",
      });

      // Sync plan to Clerk publicMetadata
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: { plan: "free" },
      });
    }

    if (evt.type === "user.deleted") {
      const { id: clerkUserId } = evt.data;
      if (clerkUserId) {
        try {
          await polar.customers.deleteExternal({ externalId: clerkUserId });
        } catch (err) {
          // Ignore only "not found"; surface all other failures.
          if (err instanceof ResourceNotFound) return;
          throw err;
        }
        await db.delete(users).where(eq(users.id, clerkUserId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 },
    );
  }
}
