import { format, parseISO } from "date-fns";

import { VenueEvent } from "@/types/event";

export const formattedDate = (
  date: string | Date,
  dotted: boolean = false,
  locale?: string,
) => {
  let local: Date;

  if (date instanceof Date) {
    local = date;
  } else {
    // Parse "YYYY-MM-DD" strings without timezone conversion
    const [year, month, day] = date.split("-").map(Number);
    local = new Date(year, month - 1, day);
  }

  // Resolve locale — use provided locale, fall back to browser locale, then "en-GB"
  const resolvedLocale =
    locale ??
    (typeof navigator !== "undefined" ? navigator.language : undefined) ??
    "en-GB";

  const formatted = local.toLocaleDateString(resolvedLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return dotted
    ? formatted.replace(/,/g, "").replace(/\s+/g, " • ")
    : formatted;
};

export const formattedDeadlineDate = (date: string) => {
  const parsed = parseISO(date);
  return format(parsed, "MMMM do, yyyy");
};

export const createCountDownLoaction = ({ value, sub }: VenueEvent) => {
  return `${value}, ${sub.split(",")[0]}`;
};

export function getExpiryStatus(
  expiresAt: string | Date | null,
): "expired" | "expiring-soon" | "expiring-month" | "active" {
  if (!expiresAt) return "active"; // null = subscription, never expires
  const exp = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 30) return "expiring-soon";
  if (daysLeft <= 60) return "expiring-month";
  return "active";
}
