// Common crawler/unfurl-bot User-Agent substrings — covers search engines,
// social-media link previews, and well-known SEO/AI scrapers. Not
// exhaustive (UA sniffing never is), but blocks the overwhelming majority
// of automated hits from inflating view counts.
const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|pinterest|redditbot|applebot|preview|headless|phantomjs|puppeteer|playwright/i;

export function isBotRequest(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // no UA at all — treat as non-human/automation
  return BOT_UA_PATTERN.test(userAgent);
}
