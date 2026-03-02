import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { customThemes } from "@/db/schema";
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

      const [updated] = await db
        .update(customThemes)
        .set({
          ...(body.name ? { name: body.name } : {}),
          ...(body.theme ? { theme: body.theme } : {}),
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
