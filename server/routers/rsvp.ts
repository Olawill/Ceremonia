import bearer from "@elysiajs/bearer";
import { count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { events, rsvps, users } from "@/db/schema";

import { RSVPNotificationEmail } from "@/emails/RSVPNotification";

import { Plan, PLAN_FEATURES } from "@/lib/plans";
import { ingestUsage } from "@/lib/polar-usage";
import { getPostHogClient } from "@/lib/posthog-server";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { resend } from "@/lib/resend";
import { getAuthUserId } from "@/server/auth";
import { EventType, getVocabulary } from "@/types/event";

export const rsvpRouter = new Elysia({ prefix: "/rsvp" })
  .use(bearer())

  // GET /api/rsvp?eventId=... — fetch RSVPs for a event (owner only)
  .get(
    "/",
    async ({ query, bearer, status }) => {
      if (!query.eventId) return status(400, { message: "Missing eventId" });

      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [event] = await db
        .select({ userId: events.userId })
        .from(events)
        .where(eq(events.id, query.eventId))
        .limit(1);
      if (!event) return status(404, { message: "Event not found" });
      if (event.userId !== userId)
        return status(403, { message: "Forbidden" });

      const result = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.eventId, query.eventId))
        .orderBy(rsvps.createdAt);

      return result;
    },
    {
      query: t.Object({
        eventId: t.Optional(t.String()),
      }),
    },
  )

  // POST /api/rsvp — submit an RSVP
  .post(
    "/",
    async ({ body, request, status }) => {
      const ip = getClientIp(request);
      const rl = await consumeRateLimit(`rsvp:${ip}`, 5, 600); // 5 per 10 min
      if (!rl.allowed) {
        return status(429, {
          message: "Too many submissions — please try again shortly.",
        });
      }

      // 1. Fetch event with owner info
      const [event] = await db
        .select({
          id: events.id,
          rsvpEnabled: events.rsvpEnabled,
          notificationEmail: events.notificationEmail,
          bride: events.bride,
          groom: events.groom,
          userId: events.userId,
          eventType: events.eventType,
        })
        .from(events)
        .where(eq(events.id, body.eventId))
        .limit(1);

      if (!event) return status(404, { message: "Event not found" });
      if (!event.rsvpEnabled)
        return status(403, { message: "RSVPs are closed" });

      // 2. Check free plan RSVP cap (20 max) + resolve owner plan once
      let ownerPlan: Plan = "free";

      if (event.userId) {
        const [owner] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, event.userId))
          .limit(1);

        ownerPlan = owner?.plan ?? "free";
        const features = PLAN_FEATURES[ownerPlan];

        if (!features.unlimitedRsvps) {
          const [{ total }] = await db
            .select({ total: count() })
            .from(rsvps)
            .where(eq(rsvps.eventId, body.eventId));

          if (total >= 20) {
            return status(403, {
              message: "RSVP limit reached for this event",
            });
          }
        }
      }

      // 3. Save to DB
      const [rsvp] = await db
        .insert(rsvps)
        .values({
          eventId: body.eventId,
          name: body.name,
          attendance: body.attendance,
          guests: body.guests ?? 1,
          dietary: body.dietary,
          message: body.message,
        })
        .returning();

      ingestUsage("rsvp_submitted", {
        userId: event.userId ?? "", // the event owner, not the guest submitting
        metadata: {
          eventId: body.eventId,
          attendance: body.attendance,
          plan: ownerPlan,
        },
      }).catch(() => {});

      // 4. Send email notification (non-blocking)
      if (event.notificationEmail && event.userId) {
        if (PLAN_FEATURES[ownerPlan].rsvpEmails) {
          resend.emails
            .send({
              from: "rsvp@ceremonia.app",
              to: event.notificationEmail,
              subject: `New RSVP from ${body.name} — ${event.groom ? `${event.bride} & ${event.groom}` : event.bride}`,
              react: RSVPNotificationEmail({
                guestName: body.name,
                attendance: body.attendance as "yes" | "no",
                guests: body.guests,
                dietary: body.dietary,
                bride: event.bride,
                groom: event.groom ?? "",
                eventLabel: getVocabulary(
                  (event.eventType as EventType) ?? "event",
                ).eventLabel,
              }),
            })
            .catch(console.error);

          ingestUsage("rsvp_email_sent", {
            userId: event.userId,
            metadata: { eventId: body.eventId, plan: ownerPlan },
          }).catch(() => {});
        }
      }

      return { success: true, id: rsvp.id };
    },
    {
      body: t.Object({
        eventId: t.String(),
        name: t.String({ minLength: 1, maxLength: 200 }),
        attendance: t.Union([t.Literal("yes"), t.Literal("no")]),
        guests: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
        dietary: t.Optional(t.String({ maxLength: 500 })),
        message: t.Optional(t.String({ maxLength: 2000 })),
      }),
    },
  )

  // GET /api/rsvp/export?eventId=... — CSV download (owner, Pro+)
  .get(
    "/export",
    async ({ query, bearer, status }) => {
      if (!query.eventId) return status(400, { message: "eventId required" });

      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Verify the requesting user owns this event and is on Pro+
      const [event] = await db
        .select({ userId: events.userId })
        .from(events)
        .where(eq(events.id, query.eventId))
        .limit(1);
      if (!event) return status(404, { message: "Event not found" });
      if (event.userId !== userId)
        return status(403, { message: "Forbidden" });

      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!PLAN_FEATURES[owner?.plan ?? "free"].csvExport) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "csv_export", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, { message: "CSV export requires the Pro plan." });
      }

      const rows = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.eventId, query.eventId))
        .orderBy(rsvps.createdAt);

      // Escape embedded quotes per CSV spec so a guest's name/message can't
      // corrupt the file structure.
      const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const header = "Name,Attendance,Guests,Dietary,Message,Submitted At\n";
      const csv =
        header +
        rows
          .map((r) =>
            [
              csvCell(r.name),
              r.attendance,
              r.guests ?? 1,
              csvCell(r.dietary ?? ""),
              csvCell(r.message ?? ""),
              r.createdAt?.toISOString() ?? "",
            ].join(","),
          )
          .join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="rsvps-${query.eventId}.csv"`,
        },
      });
    },
    {
      query: t.Object({
        eventId: t.Optional(t.String()),
      }),
    },
  );
