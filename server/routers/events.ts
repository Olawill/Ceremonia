import bearer from "@elysiajs/bearer";
import { and, count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { users, weddings } from "@/db/schema";

import { hashPassword } from "@/lib/password";
import { PLAN_FEATURES } from "@/lib/plans";

import { getPostHogClient } from "@/lib/posthog-server";
import { getAuthUserId } from "@/server/auth";
import { CURTAIN_STYLES } from "@/types/wedding";

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

const CurtainStyleSchema = t.UnionEnum(CURTAIN_STYLES);

const EventBodySchema = t.Object({
  bride: t.String({ minLength: 1 }),
  groom: t.Optional(t.String()),
  eventType: t.Optional(t.String()),
  host1Name: t.Optional(t.String()),
  host2Name: t.Optional(t.String()),
  tagLine: t.Optional(t.String()),
  finaleTagLine: t.Optional(t.String()),
  customDomain: t.Optional(t.String()),
  date: t.String(),
  venueDetails: t.Array(VenueEventSchema),
  themeKey: t.String(),
  curtainStyle: CurtainStyleSchema,
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
  guestBookEnabled: t.Optional(t.Boolean()),
  dressCodeEnabled: t.Optional(t.Boolean()),
  dressCode: t.Optional(t.Any()),
  accommodationEnabled: t.Optional(t.Boolean()),
  accommodation: t.Optional(t.Any()),
  weddingPartyEnabled: t.Optional(t.Boolean()),
  weddingParty: t.Optional(t.Any()),
  faqEnabled: t.Optional(t.Boolean()),
  faq: t.Optional(t.Any()),
  livestreamEnabled: t.Optional(t.Boolean()),
  livestreamUrl: t.Optional(t.String()),
  livestreamTitle: t.Optional(t.String()),
  livestreamNote: t.Optional(t.String()),
  photoGalleryEnabled: t.Optional(t.Boolean()),
  galleryPhotos: t.Optional(t.Any()),
  travelGuideEnabled: t.Optional(t.Boolean()),
  travelItems: t.Optional(t.Any()),
});

export const eventsRouter = new Elysia({ prefix: "/events" })
  .use(bearer())

  // GET /api/events — list all weddings for current user
  .get("/", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const result = await db
      .select()
      .from(weddings)
      .where(eq(weddings.userId, userId));

    return result;
  })

  // GET /api/events/:slug — get a single wedding (must be owner)
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

  // POST /api/events — create new wedding
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

      const plan = owner?.plan ?? "free";
      const features = PLAN_FEATURES[plan];
      const [{ weddingCount }] = await db
        .select({ weddingCount: count() })
        .from(weddings)
        .where(eq(weddings.userId, userId));

      if (weddingCount >= features.maxEvents) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: {
            feature: "max_events",
            plan,
            limit: features.maxEvents,
          },
        });
        await posthog.shutdown();
        return status(403, {
          message: `Your ${plan} plan allows a maximum of ${features.maxEvents} wedding(s). Please upgrade.`,
        });
      }

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

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      let created;
      try {
        [created] = await db
          .insert(weddings)
          .values({
            ...body,
            slug: finalSlug,
            groom: body.groom ?? "",
            eventType: body.eventType ?? "wedding",
            userId,
            password: body.password ? hashPassword(body.password) : null,
          })
          .returning();
      } catch (e) {
        console.error("INSERT ERROR:", e);
        return status(500, { message: String(e) });
      }

      return created;
    },
    { body: EventBodySchema },
  )

  // PATCH /api/events/:slug — update (owner only)
  .patch(
    "/:slug",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Fetch owner plan for field-level gating
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const features = PLAN_FEATURES[owner?.plan ?? "free"];

      // Block plan-gated fields from being saved by lower-tier users
      if (body.customDomain && !features.customDomain) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "custom_domain", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, { message: "Custom domains require the Pro plan." });
      }
      if (body.passwordProtected && !features.passwordProtection) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "password_protection", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, {
          message: "Password protection requires the Pro plan.",
        });
      }
      if (body.audioUrl && !features.customAudio) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "custom_audio", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, {
          message: "Custom audio requires the Starter plan.",
        });
      }

      const [updated] = await db
        .update(weddings)
        .set({
          ...body,
          ...(body.eventType !== undefined
            ? { eventType: body.eventType }
            : {}),
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
    { body: t.Partial(EventBodySchema) },
  )

  // DELETE /api/events/:slug
  .delete("/:slug", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    await db
      .delete(weddings)
      .where(and(eq(weddings.slug, params.slug), eq(weddings.userId, userId)));

    return { success: true };
  });
