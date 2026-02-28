// server/routers/rsvp.ts
import { db } from "@/db";
import { rsvps, weddings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

export const rsvpRouter = new Elysia({ prefix: "/rsvp" }).post(
  "/",
  async ({ body, status }) => {
    // Verify wedding exists and RSVP is enabled
    const [wedding] = await db
      .select({ id: weddings.id, rsvpEnabled: weddings.rsvpEnabled })
      .from(weddings)
      .where(eq(weddings.id, body.weddingId))
      .limit(1);

    if (!wedding) return status(404, { message: "Wedding not found" });
    if (!wedding.rsvpEnabled)
      return status(403, { message: "RSVPs are closed" });

    const [rsvp] = await db.insert(rsvps).values(body).returning();

    // Email notification comes in Week 6 — placeholder here
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
);
