import bearer from "@elysiajs/bearer";
import { and, count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { events, users } from "@/db/schema";

import { hashPassword } from "@/lib/password";
import {
  computeEventExpiry,
  MONTHLY_EVENTS,
  PLAN_FEATURES,
  type Plan,
} from "@/lib/plans";
import { consumeRoomCredit, getRoomCreditBalance } from "@/lib/rooms-credits";

import { ingestUsage } from "@/lib/polar-usage";
import { getPostHogClient } from "@/lib/posthog-server";
import { getAuthUserId } from "@/server/auth";
import { CURTAIN_STYLES, FEATURE_MODES } from "@/types/event";

// Thrown from inside the create-event transaction when a plan limit is hit —
// caught outside to report analytics and shape the 403 response.
class QuotaExceededError extends Error {
  constructor(
    public feature: "monthly_events" | "lifetime_events",
    public plan: Plan,
    public limit: number,
  ) {
    super("QUOTA_EXCEEDED");
  }
}

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
  eventPartyEnabled: t.Optional(t.Boolean()),
  eventParty: t.Optional(t.Any()),
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
  cashGiftEnabled: t.Optional(t.Boolean()),
  cashGift: t.Optional(t.Any()),
  navMode: t.Optional(t.UnionEnum(["scroll", "rooms"])),
  featureMode: t.Optional(t.UnionEnum(FEATURE_MODES)),
});

export const eventsRouter = new Elysia({ prefix: "/events" })
  .use(bearer())

  // GET /api/events — list all events for current user
  .get("/", async ({ bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const result = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    return result;
  })

  // GET /api/events/:slug — get a single event (must be owner)
  .get("/:slug", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.slug, params.slug), eq(events.userId, userId)))
      .limit(1);

    if (!event) return status(404, { message: "Not found" });

    // Check if event has expired
    if (event.expiresAt && new Date() > new Date(event.expiresAt)) {
      return status(410, {
        message: "This event has expired. Please renew your hosting plan.",
      });
    }

    return event;
  })

  // POST /api/events — create new event
  .post(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      try {
        // The quota check-then-insert is wrapped in a transaction with a row
        // lock on the user, so two concurrent create requests from the same
        // user can't both pass the cap check and both insert, exceeding the
        // plan's event limit.
        const { created, plan } = await db.transaction(async (tx) => {
          const [owner] = await tx
            .select({
              plan: users.plan,
              starterIsOnce: users.starterIsOnce,
              monthlyEventsCreated: users.monthlyEventsCreated,
              eventPeriodStart: users.eventPeriodStart,
            })
            .from(users)
            .where(eq(users.id, userId))
            .for("update")
            .limit(1);

          const plan: Plan = owner?.plan ?? "free";
          const isOnce = owner?.starterIsOnce ?? false;
          const expiresAt = computeEventExpiry(plan, isOnce);

          const features = PLAN_FEATURES[plan];
          const monthlyLimit = MONTHLY_EVENTS[plan];
          const now = new Date();
          const periodStart = owner?.eventPeriodStart
            ? new Date(owner.eventPeriodStart)
            : now;

          // Reset monthly quota if we've crossed into a new month
          const isNewMonth =
            now.getUTCMonth() !== periodStart.getUTCMonth() ||
            now.getUTCFullYear() !== periodStart.getUTCFullYear();
          const currentMonthlyCreated = isNewMonth
            ? 0
            : (owner?.monthlyEventsCreated ?? 0);

          // Check monthly quota (skip for one-time plans which use lifetime check)
          if (
            !isOnce &&
            monthlyLimit !== Infinity &&
            currentMonthlyCreated >= monthlyLimit
          ) {
            throw new QuotaExceededError("monthly_events", plan, monthlyLimit);
          }

          // Lifetime cap still applies to free and one-time starter
          const lifetimeCap = features.maxEvents;
          const [{ eventCount }] = await tx
            .select({ eventCount: count() })
            .from(events)
            .where(eq(events.userId, userId));

          if (eventCount >= lifetimeCap) {
            throw new QuotaExceededError("lifetime_events", plan, lifetimeCap);
          }

          // Enforce slug uniqueness — derive from names
          const slug = `${body.bride}-${body.groom}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const [existing] = await tx
            .select({ id: events.id })
            .from(events)
            .where(eq(events.slug, slug))
            .limit(1);

          const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

          const [createdRow] = await tx
            .insert(events)
            .values({
              ...body,
              slug: finalSlug,
              groom: body.groom ?? "",
              eventType: body.eventType ?? "event",
              userId,
              password: body.password ? hashPassword(body.password) : null,
              expiresAt,
            })
            .returning();

          // Increment monthly event counter and reset period if new month
          await tx
            .update(users)
            .set({
              monthlyEventsCreated: isNewMonth ? 1 : currentMonthlyCreated + 1,
              eventPeriodStart: isNewMonth ? now : periodStart,
            })
            .where(eq(users.id, userId));

          return { created: createdRow, plan };
        });

        // Non-blocking — don't await at the top level:
        ingestUsage("event_created", {
          userId,
          metadata: {
            eventType: body.eventType ?? "wedding",
            plan,
            slug: created.slug,
          },
        }).catch(() => {}); // already swallowed inside ingestUsage, but belt-and-suspenders

        return created;
      } catch (e) {
        if (e instanceof QuotaExceededError) {
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: userId,
            event: "plan_limit_hit",
            properties: { feature: e.feature, plan: e.plan, limit: e.limit },
          });
          await posthog.shutdown();
          const noun =
            e.feature === "monthly_events"
              ? `${e.limit} event(s) per month`
              : `a maximum of ${e.limit} event(s)`;
          const suffix =
            e.feature === "monthly_events"
              ? "Please upgrade or wait until next month."
              : "Please upgrade.";
          return status(403, {
            message: `Your ${e.plan} plan allows ${noun}. ${suffix}`,
          });
        }
        console.error("INSERT ERROR:", e);
        return status(500, { message: String(e) });
      }
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

      if (body.cashGiftEnabled && !features.cashGifts) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "cash_gifts", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, {
          message: "Monetary gifts require the Starter plan.",
        });
      }

      // Verify the event exists and is owned by this user before doing
      // anything else (e.g. spending a rooms credit) — a PATCH to a
      // nonexistent/foreign slug should 404, not burn a credit first.
      const [existingEvent] = await db
        .select({ navMode: events.navMode })
        .from(events)
        .where(and(eq(events.slug, params.slug), eq(events.userId, userId)))
        .limit(1);

      if (!existingEvent) return status(404, { message: "Not found" });

      // ── Rooms credit consumption ─────────────────────────────────
      // Detect navMode transition to "rooms" and consume one credit
      let roomsCreditsResult = null;
      if (body.navMode === "rooms") {
        const isRoomsTransition = existingEvent.navMode !== "rooms";

        if (isRoomsTransition) {
          try {
            roomsCreditsResult = await consumeRoomCredit(
              userId,
              owner?.plan ?? "free",
            );
          } catch (err: unknown) {
            if ((err as Error).message === "NO_CREDITS") {
              return status(403, {
                message:
                  "No rooms credits remaining. Purchase a 5-credit pack to enable 3D rooms.",
              });
            }
            throw err;
          }
        }
      }

      const [updated] = await db
        .update(events)
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
        .where(and(eq(events.slug, params.slug), eq(events.userId, userId)))
        .returning();

      if (!updated) return status(404, { message: "Not found" });

      // Return updated event with current credit balance
      const balance = await getRoomCreditBalance(userId, owner?.plan ?? "free");
      return {
        event: updated,
        roomsCredits: {
          freeRemaining: balance.free.remaining,
          purchasedRemaining: balance.purchased.remaining,
          totalRemaining: balance.totalRemaining,
        },
      };
    },
    { body: t.Partial(EventBodySchema) },
  )

  // DELETE /api/events/:slug
  .delete("/:slug", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    await db
      .delete(events)
      .where(and(eq(events.slug, params.slug), eq(events.userId, userId)));

    return { success: true };
  });
