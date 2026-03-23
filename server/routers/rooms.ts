import { db } from "@/db";
import { roomsCredits, users } from "@/db/schema";
import { env } from "@/env";
import { ROOMS_CREDITS_AGENCY_MONTHLY_FREE } from "@/lib/plans";
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

    const plan = user.plan ?? "free";

    // Get or create credit row for this user
    const existing = await db
      .select()
      .from(roomsCredits)
      .where(eq(roomsCredits.userId, userId))
      .limit(1);

    if (!existing.length) {
      // Bootstrap: Agency gets free monthly credits seeded on first check
      const freeCredits =
        plan === "agency" ? ROOMS_CREDITS_AGENCY_MONTHLY_FREE : 0;
      const [row] = await db
        .insert(roomsCredits)
        .values({ userId, creditsTotal: freeCredits, creditsUsed: 0 })
        .returning();
      return { total: row.creditsTotal, used: row.creditsUsed };
    }

    const row = existing[0];
    return { total: row.creditsTotal, used: row.creditsUsed };
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
