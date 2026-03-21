import type { EventConfig } from "@/types/event";
import { getVocabulary } from "@/types/event";

/**
 * Returns the display name for host 1.
 * For weddings: config.bride. For other events: config.host1Name ?? config.bride.
 */
export function getHost1Name(config: EventConfig): string {
  return config.host1Name ?? config.bride;
}

/**
 * Returns the display name for host 2, if applicable.
 */
export function getHost2Name(config: EventConfig): string | undefined {
  const vocab = getVocabulary(config.eventType);
  if (!vocab.dualHost) return undefined;
  return config.host2Name ?? config.groom;
}

/**
 * Returns a formatted "Host1 & Host2" string, e.g. "Isabella & Alexander"
 * For single-host events just returns the host name.
 */
export function getHostsLabel(config: EventConfig): string {
  const h1 = getHost1Name(config);
  const h2 = getHost2Name(config);
  return h2 ? `${h1} & ${h2}` : h1;
}
