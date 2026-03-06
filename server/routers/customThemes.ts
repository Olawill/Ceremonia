import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { customThemes, users } from "@/db/schema";
import { PLAN_FEATURES } from "@/lib/plans";
import { getAuthUserId } from "@/server/auth";
import { bearer } from "@elysiajs/bearer";

const ThemeSchema = t.Object({
  key: t.String(),
  name: t.String(),
  curtain: t.String(),
  curtainDark: t.String(),
  curtainSheen: t.String(),
  gold: t.String(),
  goldLight: t.String(),
  bg: t.String(),
  bgMid: t.String(),
  text: t.String(),
  particle: t.String(),
});

export const customThemesRouter = new Elysia({ prefix: "/custom-themes" })
  .use(bearer())

  // GET /api/custom-themes — list user's saved themes
  .get("/", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const result = await db
      .select()
      .from(customThemes)
      .where(eq(customThemes.userId, userId));

    return result;
  })

  // POST /api/custom-themes — save a new custom theme
  .post(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!PLAN_FEATURES[owner?.plan ?? "free"].customThemes) {
        return status(403, { message: "Custom themes require the Pro plan." });
      }

      const [created] = await db
        .insert(customThemes)
        .values({
          userId,
          name: body.name,
          theme: body.theme,
        })
        .returning();

      return created;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        theme: ThemeSchema,
      }),
    },
  )

  // PATCH /api/custom-themes/:id — update a saved theme
  .patch(
    "/:id",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!PLAN_FEATURES[owner?.plan ?? "free"].customThemes) {
        return status(403, { message: "Custom themes require the Pro plan." });
      }

      const [updated] = await db
        .update(customThemes)
        .set({
          ...(body.name ? { name: body.name } : {}),
          ...(body.theme ? { theme: body.theme } : {}),
          ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
        })
        .where(
          and(eq(customThemes.id, params.id), eq(customThemes.userId, userId)),
        )
        .returning();

      if (!updated) return status(404, { message: "Not found" });
      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        theme: t.Optional(ThemeSchema),
        isPublic: t.Optional(t.Boolean()),
      }),
    },
  )

  // DELETE /api/custom-themes/:id
  .delete("/:id", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    await db
      .delete(customThemes)
      .where(
        and(eq(customThemes.id, params.id), eq(customThemes.userId, userId)),
      );

    return { success: true };
  });
