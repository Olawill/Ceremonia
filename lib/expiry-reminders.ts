import { and, gt, isNotNull, lt } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import { formattedDate } from "@/lib/helper";
import { resend } from "@/lib/resend";

/**
 * Sends reminder emails for events expiring in the next 7 days.
 * Safe to call repeatedly — uses a reminderSentAt guard.
 * Call this from a Vercel cron at /api/cron/expiry-reminders.
 */
export async function sendExpiryReminders() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const now = new Date();

  // Find events expiring within 7 days that haven't been reminded yet
  const expiring = await db
    .select({
      slug: events.slug,
      bride: events.bride,
      expiresAt: events.expiresAt,
      notificationEmail: events.notificationEmail,
      userId: events.userId,
    })
    .from(events)
    .where(
      and(
        isNotNull(events.expiresAt),
        gt(events.expiresAt, now),
        lt(events.expiresAt, sevenDaysFromNow),
      ),
    );

  for (const event of expiring) {
    const email = event.notificationEmail;
    if (!email) continue;

    const expiresAt = formattedDate(event.expiresAt!);

    try {
      await resend.emails.send({
        from: "Ceremonia <noreply@ceremonia.app>",
        to: email,
        subject: `Your Ceremonia event page expires on ${expiresAt}`,
        html: `
          <p>Hi,</p>
          <p>Your event page <strong>${event.slug}.ceremonia.app</strong> will expire on <strong>${expiresAt}</strong>.</p>
          <p>After this date, guests visiting your invitation will see an expired page.</p>
          <p>To keep your event live, <a href="https://app.ceremonia.app/app/billing">upgrade to a monthly plan</a>.</p>
          <p>— The Ceremonia team</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send expiry reminder", {
        slug: event.slug,
        error,
      });
      continue;
    }
  }
}
