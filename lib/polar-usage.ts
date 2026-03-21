import { polar } from "@/lib/polar";

type UsageEventName =
  | "event_created"
  | "rsvp_submitted"
  | "registry_item_added"
  | "registry_scrape"
  | "media_uploaded"
  | "rsvp_email_sent";

interface IngestOptions {
  userId: string; // Clerk userId — used as externalCustomerId
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Fire-and-forget usage event ingestion.
 * Never throws — usage tracking must never block the primary action.
 */
export async function ingestUsage(
  name: UsageEventName,
  opts: IngestOptions,
): Promise<void> {
  try {
    await polar.events.ingest({
      events: [
        {
          name,
          externalCustomerId: opts.userId,
          metadata: opts.metadata ?? {},
        },
      ],
    });
  } catch (err) {
    // Log but never surface to the user — usage tracking is best-effort
    console.error(`[polar-usage] Failed to ingest "${name}":`, err);
  }
}
