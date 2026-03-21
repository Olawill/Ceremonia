import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { events, guestbook } from "@/db/schema";

import { getPostHogClient } from "@/lib/posthog-server";

import { getAuthUserId } from "@/server/auth";

export const guestbookRouter = new Elysia({ prefix: "/guestbook" })
  .use(bearer())

  // GET /api/guestbook/:eventSlug — public, no auth needed
  .get("/:eventSlug", async ({ params, status }) => {
    const [event] = await db
      .select({ id: events.id, guestBookEnabled: events.guestBookEnabled })
      .from(events)
      .where(eq(events.slug, params.eventSlug))
      .limit(1);

    if (!event) return status(404, { message: "Event not found" });
    if (!event.guestBookEnabled)
      return status(403, { message: "Guest book is not enabled" });

    const messages = await db
      .select()
      .from(guestbook)
      .where(eq(guestbook.eventId, event.id))
      .orderBy(guestbook.createdAt);

    return messages;
  })

  // POST /api/guestbook/:eventSlug — public write (guests don't have auth)
  .post(
    "/:eventSlug",
    async ({ params, body, status }) => {
      const [event] = await db
        .select({
          id: events.id,
          userId: events.userId,
          guestBookEnabled: events.guestBookEnabled,
        })
        .from(events)
        .where(eq(events.slug, params.eventSlug))
        .limit(1);

      if (!event) return status(404, { message: "Event not found" });
      if (!event.guestBookEnabled)
        return status(403, { message: "Guest book is not enabled" });

      // Plan check: guestBook is a Pro+ feature — check the owner's plan
      const { users } = await import("@/db/schema");
      const { planMeetsRequirement } = await import("@/lib/plans");
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, event.userId!))
        .limit(1);

      if (!planMeetsRequirement((owner?.plan ?? "free") as any, "pro")) {
        return status(403, { message: "Guest book requires the Pro plan." });
      }

      const [entry] = await db
        .insert(guestbook)
        .values({
          eventId: event.id,
          name: body.name,
          message: body.message,
        })
        .returning();

      // PostHog event
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: event.userId ?? "guest",
        event: "guestbook_message_submitted",
        properties: { eventId: event.id, eventSlug: params.eventSlug },
      });
      await posthog.shutdown();

      return entry;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        message: t.String({ minLength: 1, maxLength: 1000 }),
      }),
    },
  )

  // DELETE /api/guestbook/:eventSlug/:messageId — owner only
  .delete("/:eventSlug/:messageId", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, params.eventSlug))
      .limit(1);

    if (!event) return status(404, { message: "Not found" });

    await db.delete(guestbook).where(eq(guestbook.id, params.messageId));

    return { success: true };
  });
