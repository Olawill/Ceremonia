import { count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { events, rsvps, users } from "@/db/schema";

import { RSVPNotificationEmail } from "@/emails/RSVPNotification";

import { Plan, PLAN_FEATURES } from "@/lib/plans";
import { ingestUsage } from "@/lib/polar-usage";
import { getPostHogClient } from "@/lib/posthog-server";
import { resend } from "@/lib/resend";
import { EventType, getVocabulary } from "@/types/event";

export const rsvpRouter = new Elysia({ prefix: "/rsvp" })
  // GET /api/rsvp?eventId=... — fetch RSVPs for a event (used by dashboard)
  .get(
    "/",
    async ({ query, status }) => {
      if (!query.eventId) return status(400, { message: "Missing eventId" });

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
    async ({ body, status }) => {
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
        name: t.String({ minLength: 1 }),
        attendance: t.Union([t.Literal("yes"), t.Literal("no")]),
        guests: t.Optional(t.Number()),
        dietary: t.Optional(t.String()),
        message: t.Optional(t.String()),
      }),
    },
  )

  // GET /api/rsvp/export?eventId=... — CSV download (Pro)
  .get(
    "/export",
    async ({ query, status }) => {
      if (!query.eventId) return status(400, { message: "eventId required" });

      // Verify the requesting user owns this event and is on Pro+
      const [event] = await db
        .select({ userId: events.userId })
        .from(events)
        .where(eq(events.id, query.eventId))
        .limit(1);

      if (event?.userId) {
        const [owner] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, event.userId))
          .limit(1);

        if (!PLAN_FEATURES[owner?.plan ?? "free"].csvExport) {
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: event.userId,
            event: "plan_limit_hit",
            properties: { feature: "csv_export", plan: owner?.plan },
          });
          await posthog.shutdown();
          return status(403, { message: "CSV export requires the Pro plan." });
        }
      }

      const rows = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.eventId, query.eventId))
        .orderBy(rsvps.createdAt);

      const header = "Name,Attendance,Guests,Dietary,Message,Submitted At\n";
      const csv =
        header +
        rows
          .map((r) =>
            [
              `"${r.name}"`,
              r.attendance,
              r.guests ?? 1,
              `"${r.dietary ?? ""}"`,
              `"${r.message ?? ""}"`,
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
