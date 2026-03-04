import { bearer } from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUserId } from "@/server/auth";

export const settingsRouter = new Elysia({ prefix: "/settings" })
  .use(bearer())

  // GET /api/settings — fetch current user profile
  .get("/", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [user] = await db
      .select({ email: users.email, plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return status(404, { message: "User not found" });
    return user;
  })

  .patch(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [updated] = await db
        .update(users)
        .set({
          ...(body.brandName !== undefined
            ? { brandName: body.brandName }
            : {}),
        })
        .where(eq(users.id, userId))
        .returning({
          email: users.email,
          plan: users.plan,
          brandName: users.brandName,
        });

      return updated;
    },
    {
      body: t.Object({
        brandName: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /api/settings/account — delete account + all weddings (cascade)
  .delete("/account", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    await db.delete(users).where(eq(users.id, userId));
    return { success: true };
  });
