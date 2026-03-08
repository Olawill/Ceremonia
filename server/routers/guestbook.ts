import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { guestbook, weddings } from "@/db/schema";

import { getPostHogClient } from "@/lib/posthog-server";

import { getAuthUserId } from "@/server/auth";

export const guestbookRouter = new Elysia({ prefix: "/guestbook" })
  .use(bearer())

  // GET /api/guestbook/:weddingSlug — public, no auth needed
  .get("/:weddingSlug", async ({ params, status }) => {
    const [wedding] = await db
      .select({ id: weddings.id, guestBookEnabled: weddings.guestBookEnabled })
      .from(weddings)
      .where(eq(weddings.slug, params.weddingSlug))
      .limit(1);

    if (!wedding) return status(404, { message: "Wedding not found" });
    if (!wedding.guestBookEnabled)
      return status(403, { message: "Guest book is not enabled" });

    const messages = await db
      .select()
      .from(guestbook)
      .where(eq(guestbook.weddingId, wedding.id))
      .orderBy(guestbook.createdAt);

    return messages;
  })

  // POST /api/guestbook/:weddingSlug — public write (guests don't have auth)
  .post(
    "/:weddingSlug",
    async ({ params, body, status }) => {
      const [wedding] = await db
        .select({
          id: weddings.id,
          userId: weddings.userId,
          guestBookEnabled: weddings.guestBookEnabled,
        })
        .from(weddings)
        .where(eq(weddings.slug, params.weddingSlug))
        .limit(1);

      if (!wedding) return status(404, { message: "Wedding not found" });
      if (!wedding.guestBookEnabled)
        return status(403, { message: "Guest book is not enabled" });

      // Plan check: guestBook is a Pro+ feature — check the owner's plan
      const { users } = await import("@/db/schema");
      const { planMeetsRequirement } = await import("@/lib/plans");
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, wedding.userId!))
        .limit(1);

      if (!planMeetsRequirement((owner?.plan ?? "free") as any, "pro")) {
        return status(403, { message: "Guest book requires the Pro plan." });
      }

      const [entry] = await db
        .insert(guestbook)
        .values({
          weddingId: wedding.id,
          name: body.name,
          message: body.message,
        })
        .returning();

      // PostHog event
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: wedding.userId ?? "guest",
        event: "guestbook_message_submitted",
        properties: { weddingId: wedding.id, weddingSlug: params.weddingSlug },
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

  // DELETE /api/guestbook/:weddingSlug/:messageId — owner only
  .delete("/:weddingSlug/:messageId", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [wedding] = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.slug, params.weddingSlug))
      .limit(1);

    if (!wedding) return status(404, { message: "Not found" });

    await db.delete(guestbook).where(eq(guestbook.id, params.messageId));

    return { success: true };
  });
