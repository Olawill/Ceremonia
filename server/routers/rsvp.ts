import { count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { Resend } from "resend";

import { db } from "@/db";
import { rsvps, users, weddings } from "@/db/schema";

import { RSVPNotificationEmail } from "@/emails/RSVPNotification";

import { env } from "@/env";

import { PLAN_FEATURES } from "@/lib/plans";

const resend = new Resend(env.RESEND_API_KEY);

export const rsvpRouter = new Elysia({ prefix: "/rsvp" })
  // GET /api/rsvp?weddingId=... — fetch RSVPs for a wedding (used by dashboard)
  .get(
    "/",
    async ({ query, status }) => {
      if (!query.weddingId)
        return status(400, { message: "Missing weddingId" });

      const result = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.weddingId, query.weddingId))
        .orderBy(rsvps.createdAt);

      return result;
    },
    {
      query: t.Object({
        weddingId: t.Optional(t.String()),
      }),
    },
  )

  // POST /api/rsvp — submit an RSVP
  .post(
    "/",
    async ({ body, status }) => {
      // 1. Fetch wedding with owner info
      const [wedding] = await db
        .select({
          id: weddings.id,
          rsvpEnabled: weddings.rsvpEnabled,
          notificationEmail: weddings.notificationEmail,
          bride: weddings.bride,
          groom: weddings.groom,
          userId: weddings.userId,
        })
        .from(weddings)
        .where(eq(weddings.id, body.weddingId))
        .limit(1);

      if (!wedding) return status(404, { message: "Wedding not found" });
      if (!wedding.rsvpEnabled)
        return status(403, { message: "RSVPs are closed" });

      // 2. Check free plan RSVP cap (20 max)
      if (wedding.userId) {
        const [owner] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, wedding.userId))
          .limit(1);

        const plan = owner?.plan ?? "free";
        const features = PLAN_FEATURES[plan];

        if (!features.unlimitedRsvps) {
          const [{ total }] = await db
            .select({ total: count() })
            .from(rsvps)
            .where(eq(rsvps.weddingId, body.weddingId));

          if (total >= 20) {
            return status(403, {
              message: "RSVP limit reached for this wedding",
            });
          }
        }
      }

      // 3. Save to DB
      const [rsvp] = await db
        .insert(rsvps)
        .values({
          weddingId: body.weddingId,
          name: body.name,
          attendance: body.attendance,
          guests: body.guests ?? 1,
          dietary: body.dietary,
          message: body.message,
        })
        .returning();

      // 4. Send email notification (non-blocking)
      if (wedding.notificationEmail && wedding.userId) {
        const [owner] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, wedding.userId))
          .limit(1);

        if (PLAN_FEATURES[owner?.plan ?? "free"].rsvpEmails) {
          resend.emails
            .send({
              from: "rsvp@ceremonia.app",
              to: wedding.notificationEmail,
              subject: `New RSVP from ${body.name} — ${wedding.bride} & ${wedding.groom}`,
              react: RSVPNotificationEmail({
                guestName: body.name,
                attendance: body.attendance as "yes" | "no",
                guests: body.guests,
                dietary: body.dietary,
                bride: wedding.bride,
                groom: wedding.groom,
              }),
            })
            .catch(console.error);
        }
      }

      return { success: true, id: rsvp.id };
    },
    {
      body: t.Object({
        weddingId: t.String(),
        name: t.String({ minLength: 1 }),
        attendance: t.Union([t.Literal("yes"), t.Literal("no")]),
        guests: t.Optional(t.Number()),
        dietary: t.Optional(t.String()),
        message: t.Optional(t.String()),
      }),
    },
  )

  // GET /api/rsvp/export?weddingId=... — CSV download (Pro)
  .get(
    "/export",
    async ({ query, status }) => {
      if (!query.weddingId)
        return status(400, { message: "weddingId required" });

      // Verify the requesting user owns this wedding and is on Pro+
      const [wedding] = await db
        .select({ userId: weddings.userId })
        .from(weddings)
        .where(eq(weddings.id, query.weddingId))
        .limit(1);

      if (wedding?.userId) {
        const [owner] = await db
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, wedding.userId))
          .limit(1);

        if (!PLAN_FEATURES[owner?.plan ?? "free"].csvExport) {
          return status(403, { message: "CSV export requires the Pro plan." });
        }
      }

      const rows = await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.weddingId, query.weddingId))
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
          "Content-Disposition": `attachment; filename="rsvps-${query.weddingId}.csv"`,
        },
      });
    },
    {
      query: t.Object({
        weddingId: t.Optional(t.String()),
      }),
    },
  );
