import bearer from "@elysiajs/bearer";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { weddings } from "@/db/schema";

import { hashPassword } from "@/lib/password";
import { getAuthUserId } from "@/server/auth";

// Zod-compatible Elysia schema for a VenueEvent
const VenueEventSchema = t.Object({
  label: t.String(),
  value: t.String(),
  sub: t.Optional(t.String()),
});

const TimelineEventSchema = t.Object({
  year: t.String(),
  icon: t.String(),
  title: t.String(),
  desc: t.Optional(t.String()),
});

const CourseSchema = t.Object({
  course: t.String(),
  items: t.Array(t.String()),
});

const WeddingBodySchema = t.Object({
  bride: t.String({ minLength: 1 }),
  groom: t.String({ minLength: 1 }),
  tagLine: t.Optional(t.String()),
  finaleTagLine: t.Optional(t.String()),
  customDomain: t.Optional(t.String()),
  date: t.String(),
  venueDetails: t.Array(VenueEventSchema),
  themeKey: t.String(),
  curtainStyle: t.Union([t.Literal("velvet"), t.Literal("drape")]),
  audioUrl: t.Optional(t.String()),
  heroPhotoUrl: t.Optional(t.String()),
  timeline: t.Array(TimelineEventSchema),
  menuCourses: t.Array(CourseSchema),
  rsvpEnabled: t.Boolean(),
  rsvpDeadline: t.Optional(t.String()),
  published: t.Boolean(),
  passwordProtected: t.Boolean(),
  password: t.Optional(t.String()),
  notificationEmail: t.Optional(t.String()),
});

export const weddingsRouter = new Elysia({ prefix: "/weddings" })
  .use(bearer())

  // GET /api/weddings — list all weddings for current user
  .get("/", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const result = await db
      .select()
      .from(weddings)
      .where(eq(weddings.userId, userId));

    return result;
  })

  // GET /api/weddings/:slug — get a single wedding (must be owner)
  .get("/:slug", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [wedding] = await db
      .select()
      .from(weddings)
      .where(and(eq(weddings.slug, params.slug), eq(weddings.userId, userId)))
      .limit(1);

    if (!wedding) return status(404, { message: "Not found" });
    return wedding;
  })

  // POST /api/weddings — create new wedding
  .post(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Enforce slug uniqueness — derive from names
      const slug = `${body.bride}-${body.groom}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const [existing] = await db
        .select({ id: weddings.id })
        .from(weddings)
        .where(eq(weddings.slug, slug))
        .limit(1);
      console.log({ existing });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
      console.log({ finalSlug });

      let created;
      try {
        [created] = await db
          .insert(weddings)
          .values({
            ...body,
            slug: finalSlug,
            userId,
            password: body.password ? hashPassword(body.password) : null,
          })
          .returning();
        console.log({ created });
      } catch (e) {
        console.error("INSERT ERROR:", e);
        return status(500, { message: String(e) });
      }

      return created;
    },
    { body: WeddingBodySchema },
  )

  // PATCH /api/weddings/:slug — update (owner only)
  .patch(
    "/:slug",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [updated] = await db
        .update(weddings)
        .set({
          ...body,
          // Only update password if a new one was provided
          ...(body.password ? { password: hashPassword(body.password) } : {}),
          ...(body.customDomain !== undefined
            ? { customDomain: body.customDomain || null }
            : {}),
        })
        .where(and(eq(weddings.slug, params.slug), eq(weddings.userId, userId)))
        .returning();

      if (!updated) return status(404, { message: "Not found" });
      return updated;
    },
    { body: t.Partial(WeddingBodySchema) },
  )

  // DELETE /api/weddings/:slug
  .delete("/:slug", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    await db
      .delete(weddings)
      .where(and(eq(weddings.slug, params.slug), eq(weddings.userId, userId)));

    return { success: true };
  });
