import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { polar } from "@/lib/polar";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { getAuthUserId } from "../auth";

export const billingRouter = new Elysia({ prefix: "/billing" })
  .use(bearer())

  // POST /api/billing/checkout
  // Creates a Polar checkout session server-side and returns the redirect URL
  .post(
    "/checkout",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // For upgrades, pass all upgradeable products so Polar renders a switcher
      const products = body.allProducts ?? [body.productId];

      try {
        const session = await polar.checkouts.create({
          products,
          externalCustomerId: userId,
          customerEmail: user?.email ?? undefined,
          successUrl: `${env.NEXT_PUBLIC_APP_URL}/app/billing?success=true&productId=${body.productId}`,
          metadata: { userId },
          // Required for embedded checkout — must match the origin of BillingClient page
          embedOrigin: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
        });

        return { url: session.url };
      } catch (e) {
        console.error("[billing] checkout creation failed:", e);
        return status(500, {
          message:
            "Couldn't start checkout right now. Please try again in a moment.",
        });
      }
    },
    {
      body: t.Object({
        productId: t.String(),
        allProducts: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // POST /api/billing/portal
  // Creates an authenticated Polar customer portal session and returns the URL
  .post("/portal", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [user] = await db
      .select({ polarCustomerId: users.polarCustomerId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.polarCustomerId) {
      return status(400, { message: "No billing account found" });
    }

    try {
      const session = await polar.customerSessions.create({
        customerId: user.polarCustomerId,
        returnUrl: `${env.NEXT_PUBLIC_APP_URL}/app/billing`,
      });

      return { url: session.customerPortalUrl };
    } catch (e) {
      console.error("[billing] portal session creation failed:", e);
      return status(500, {
        message:
          "Couldn't open the billing portal right now. Please try again in a moment.",
      });
    }
  });
