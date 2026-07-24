import { db } from "@/db";
import { processedWebhookEvents } from "@/db/schema";

/**
 * Idempotency guard for webhook handlers — providers like Polar retry
 * deliveries on timeout or a non-2xx response, so the same event id can
 * arrive more than once. Returns true the first time a given event id is
 * seen (caller should process it), false on every subsequent delivery
 * (caller should skip — already done).
 */
export async function claimWebhookEvent(
  id: string,
  eventType: string,
): Promise<boolean> {
  const inserted = await db
    .insert(processedWebhookEvents)
    .values({ id, eventType })
    .onConflictDoNothing()
    .returning({ id: processedWebhookEvents.id });
  return inserted.length > 0;
}
