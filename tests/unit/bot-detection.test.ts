import { isBotRequest } from "@/lib/bot-detection";
import { describe, expect, it } from "vitest";

describe("isBotRequest", () => {
  it("treats a missing User-Agent as a bot", () => {
    expect(isBotRequest(null)).toBe(true);
    expect(isBotRequest(undefined)).toBe(true);
    expect(isBotRequest("")).toBe(true);
  });

  it("flags common search-engine crawlers", () => {
    expect(isBotRequest("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBotRequest("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(isBotRequest("DuckDuckBot/1.1")).toBe(true);
  });

  it("flags social-media link-unfurling bots", () => {
    expect(isBotRequest("facebookexternalhit/1.1")).toBe(true);
    expect(isBotRequest("Twitterbot/1.0")).toBe(true);
    expect(isBotRequest("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBotRequest("WhatsApp/2.23.20.0")).toBe(true);
    expect(isBotRequest("TelegramBot (like TwitterBot)")).toBe(true);
  });

  it("flags AI/SEO scrapers", () => {
    expect(isBotRequest("Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)")).toBe(true);
    expect(isBotRequest("CCBot/2.0 (https://commoncrawl.org/faq/)")).toBe(true);
    expect(isBotRequest("Mozilla/5.0 (compatible; AhrefsBot/7.0)")).toBe(true);
  });

  it("flags headless browser automation", () => {
    expect(isBotRequest("Mozilla/5.0 HeadlessChrome/120.0.0.0")).toBe(true);
    expect(isBotRequest("Mozilla/5.0 (compatible; PhantomJS)")).toBe(true);
  });

  it("does NOT flag real desktop/mobile browsers", () => {
    expect(
      isBotRequest(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isBotRequest(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
    expect(
      isBotRequest(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      ),
    ).toBe(false);
  });
});
