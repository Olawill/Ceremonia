import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { ROOMS_CREDITS_RESET_DAYS } from "@/lib/plans";
import { getRoomCreditBalance } from "@/lib/rooms-credits";
import { polar } from "@/lib/polar";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { getAuthUserId } from "../auth";

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

    const balance = await getRoomCreditBalance(userId, user.plan ?? "free");

    const periodStart = balance.free.total > 0
      ? new Date()
      : new Date(0);
    const periodEnds = new Date(periodStart);
    periodEnds.setDate(periodEnds.getDate() + ROOMS_CREDITS_RESET_DAYS);

    return {
      // Legacy fields kept for DesignPanel compatibility
      total: balance.free.total + balance.purchased.total,
      used: balance.free.used + balance.purchased.used,
      // Detailed breakdown
      free: {
        total: balance.free.total,
        used: balance.free.used,
        remaining: balance.free.remaining,
        resetsAt: balance.free.total > 0 ? periodEnds.toISOString() : null,
      },
      purchased: {
        total: balance.purchased.total,
        used: balance.purchased.used,
        remaining: balance.purchased.remaining,
      },
      totalRemaining: balance.totalRemaining,
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
