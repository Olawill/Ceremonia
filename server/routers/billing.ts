import { stripe } from "@/lib/stripe";
import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { users } from "@/db/schema";

import { getAuthUserId } from "@/server/auth";
// import { PRICING, type Plan } from "@/lib/plans";

export const billingRouter = new Elysia({ prefix: "/billing" })
  .use(bearer())

  // POST /api/billing/checkout — create a Stripe Checkout session
  .post(
    "/checkout",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Ensure user row exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      console.log({ user });

      if (!user) return status(404, { message: "User not found" });

      const session = await stripe.checkout.sessions.create({
        mode: body.mode,
        customer: user.stripeCustomerId ?? undefined,
        customer_email: user.stripeCustomerId ? undefined : user.email,
        line_items: [{ price: body.priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?cancelled=true`,
        metadata: { userId },
        subscription_data:
          body.mode === "subscription" ? { metadata: { userId } } : undefined,
      });

      return { url: session.url };
    },
    {
      body: t.Object({
        priceId: t.String(),
        mode: t.Union([t.Literal("subscription"), t.Literal("payment")]),
      }),
    },
  )

  // POST /api/billing/portal — create a Stripe Customer Portal session
  .post("/portal", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return status(400, { message: "No billing account found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
    });

    return { url: session.url };
  });
