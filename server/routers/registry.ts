import bearer from "@elysiajs/bearer";
import { and, count, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { JSDOM } from "jsdom";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { events, registryClaims, registryItems, users } from "@/db/schema";

import { type Plan, PLAN_FEATURES, planMeetsRequirement } from "@/lib/plans";
import { getPostHogClient } from "@/lib/posthog-server";

import { ingestUsage } from "@/lib/polar-usage";
import { getAuthUserId } from "@/server/auth";
import { scrapeUrl } from "../scrape-helper";

export const registryRouter = new Elysia({ prefix: "/registry" })
  .use(bearer())

  // ── Owner routes (bearer auth required) ──────────────────────────

  // GET /api/registry/:eventId — list all items for a event (owner)
  .get("/:eventId", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    // Verify ownership
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, params.eventId), eq(events.userId, userId)))
      .limit(1);
    if (!event) return status(404, { message: "Not found" });

    const items = await db
      .select()
      .from(registryItems)
      .where(eq(registryItems.eventId, params.eventId))
      .orderBy(registryItems.sortOrder, registryItems.createdAt);

    return items;
  })

  // POST /api/registry/:eventId — add item (owner)
  .post(
    "/:eventId",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [event] = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, params.eventId), eq(events.userId, userId)))
        .limit(1);
      if (!event) return status(404, { message: "Not found" });

      // Fetch owner plan
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const plan = owner?.plan ?? "free";
      const features = PLAN_FEATURES[plan];

      // Enforce registry item cap
      if (features.registryItemLimit !== Infinity) {
        const [{ itemCount }] = await db
          .select({ itemCount: count() })
          .from(registryItems)
          .where(eq(registryItems.eventId, params.eventId));

        if (itemCount >= features.registryItemLimit) {
          const posthog = getPostHogClient();
          posthog.capture({
            distinctId: userId,
            event: "plan_limit_hit",
            properties: {
              feature: "registry_item_limit",
              plan,
              limit: features.registryItemLimit,
            },
          });
          await posthog.shutdown();
          return status(403, {
            message: `Your ${plan} plan allows a maximum of ${features.registryItemLimit} registry items. Please upgrade.`,
          });
        }
      }

      const [item] = await db
        .insert(registryItems)
        .values({
          eventId: params.eventId,
          ...body,
          currency: body.currency ?? "USD",
        })
        .returning();

      ingestUsage("registry_item_added", {
        userId,
        metadata: { eventId: params.eventId, plan },
      }).catch(() => {});

      return item;
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number()),
        currency: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        productUrl: t.Optional(t.String()),
        retailer: t.Optional(t.String()),
        quantity: t.Optional(t.Number()),
        category: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    },
  )

  // PATCH /api/registry/item/:itemId — update item (owner)
  .patch(
    "/item/:itemId",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Verify ownership via join
      const [item] = await db
        .select({ eventId: registryItems.eventId })
        .from(registryItems)
        .where(eq(registryItems.id, params.itemId))
        .limit(1);
      if (!item) return status(404, { message: "Not found" });

      const [event] = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, item.eventId), eq(events.userId, userId)))
        .limit(1);
      if (!event) return status(403, { message: "Forbidden" });

      const [updated] = await db
        .update(registryItems)
        .set(body)
        .where(eq(registryItems.id, params.itemId))
        .returning();

      return updated;
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String({ minLength: 1 }),
          description: t.String(),
          price: t.Number(),
          currency: t.String(),
          imageUrl: t.String(),
          productUrl: t.String(),
          retailer: t.String(),
          quantity: t.Number(),
          category: t.String(),
          sortOrder: t.Number(),
        }),
      ),
    },
  )

  // DELETE /api/registry/item/:itemId — remove item (owner)
  .delete("/item/:itemId", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    const [item] = await db
      .select({ eventId: registryItems.eventId })
      .from(registryItems)
      .where(eq(registryItems.id, params.itemId))
      .limit(1);
    if (!item) return status(404, { message: "Not found" });

    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, item.eventId), eq(events.userId, userId)))
      .limit(1);
    if (!event) return status(403, { message: "Forbidden" });

    await db.delete(registryItems).where(eq(registryItems.id, params.itemId));
    return { success: true };
  })

  // POST /api/registry/scrape — scrape product info from URLs (owner)
  .post(
    "/scrape",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Fetch owner plan
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!PLAN_FEATURES[owner?.plan ?? "free"].registryScraper) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "registry_scraper", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, {
          message:
            "URL scraping requires the Starter plan. Add items manually or upgrade.",
        });
      }

      const urls = Array.isArray(body.urls) ? body.urls : [body.urls];
      if (urls.length > 20)
        return status(400, { message: "Max 20 URLs at once" });

      const results = await Promise.allSettled(
        urls.map((url) => scrapeUrl(url)),
      );

      return results.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { url: "", error: "Unknown error" },
      );
    },
    {
      body: t.Object({
        urls: t.Union([t.String(), t.Array(t.String())]),
      }),
    },
  )

  // POST /api/registry/scrape-page — Agency: scrape all products from a listing/category/search page
  .post(
    "/scrape-page",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Agency-only feature
      const [user] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!planMeetsRequirement((user?.plan ?? "free") as Plan, "agency")) {
        return status(403, {
          message: "Page import requires the Agency plan.",
        });
      }

      const { url } = body;

      let html: string;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-GB,en;q=0.9",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok)
          return status(400, { message: "Could not fetch that page" });
        html = await res.text();
      } catch {
        return status(400, { message: "Could not reach that URL" });
      }

      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const hostname = new URL(url).hostname.replace("www.", "");
      const origin = new URL(url).origin;

      // ── Per-retailer product link selectors ──────────────────────────
      type RetailerConfig = {
        linkSelector: string;
        hrefFilter?: (href: string) => boolean;
        absolutify?: (href: string) => string;
      };

      const RETAILER_CONFIGS: Record<string, RetailerConfig> = {
        "amazon.co.uk": {
          linkSelector: 'a[href*="/dp/"], a[href*="/gp/product/"]',
          hrefFilter: (h) => /\/dp\/[A-Z0-9]{10}/.test(h),
          absolutify: (h) =>
            h.startsWith("http")
              ? h.split("?")[0]
              : `https://www.amazon.co.uk${h.split("?")[0]}`,
        },
        "amazon.com": {
          linkSelector: 'a[href*="/dp/"], a[href*="/gp/product/"]',
          hrefFilter: (h) => /\/dp\/[A-Z0-9]{10}/.test(h),
          absolutify: (h) =>
            h.startsWith("http")
              ? h.split("?")[0]
              : `https://www.amazon.com${h.split("?")[0]}`,
        },
        "johnlewis.com": {
          linkSelector: 'a[href*="/p/"]',
          hrefFilter: (h) => /\/p\/\d+/.test(h),
          absolutify: (h) =>
            h.startsWith("http") ? h : `https://www.johnlewis.com${h}`,
        },
        "etsy.com": {
          linkSelector: 'a[href*="/listing/"]',
          hrefFilter: (h) => /\/listing\/\d+/.test(h),
          absolutify: (h) =>
            h.startsWith("http")
              ? h.split("?")[0]
              : `https://www.etsy.com${h.split("?")[0]}`,
        },
        "ikea.com": {
          linkSelector: 'a[href*="/p/"]',
          hrefFilter: (h) => /\/p\//.test(h),
          absolutify: (h) => (h.startsWith("http") ? h : `${origin}${h}`),
        },
        "anthropologie.com": {
          linkSelector: 'a[href*="/shop/"]',
          hrefFilter: (h) => /\/shop\//.test(h),
          absolutify: (h) =>
            h.startsWith("http") ? h : `https://www.anthropologie.com${h}`,
        },
        "crateandbarrel.com": {
          linkSelector: 'a[href*="/s/"], a[class*="product"]',
          absolutify: (h) =>
            h.startsWith("http") ? h : `https://www.crateandbarrel.com${h}`,
        },
        "wayfair.com": {
          linkSelector: 'a[href*="/-/"]',
          hrefFilter: (h) => h.includes("/-/"),
          absolutify: (h) =>
            h.startsWith("http") ? h : `https://www.wayfair.com${h}`,
        },
        "notonthehighstreet.com": {
          linkSelector: 'a[href*="/product/"]',
          hrefFilter: (h) => h.includes("/product/"),
          absolutify: (h) =>
            h.startsWith("http") ? h : `https://www.notonthehighstreet.com${h}`,
        },
      };

      // ── Generic fallback: find all <a> tags that look like product pages ─
      const genericProductLinkFilter = (href: string) => {
        const lower = href.toLowerCase();
        return (
          !lower.includes("javascript:") &&
          !lower.includes("mailto:") &&
          !lower.includes("#") &&
          (lower.includes("/product") ||
            lower.includes("/item") ||
            lower.includes("/p/") ||
            lower.includes("/shop/") ||
            lower.includes("/dp/") ||
            lower.includes("/listing"))
        );
      };

      let productUrls: string[] = [];

      const config = RETAILER_CONFIGS[hostname];
      if (config) {
        const links = Array.from(
          doc.querySelectorAll<HTMLAnchorElement>(config.linkSelector),
        );
        productUrls = links
          .map((a) => a.getAttribute("href") ?? "")
          .filter((h) => h && (!config.hrefFilter || config.hrefFilter(h)))
          .map((h) => (config.absolutify ? config.absolutify(h) : h));
      } else {
        // Generic fallback
        const links = Array.from(
          doc.querySelectorAll<HTMLAnchorElement>("a[href]"),
        );
        productUrls = links
          .map((a) => a.getAttribute("href") ?? "")
          .filter(genericProductLinkFilter)
          .map((h) => (h.startsWith("http") ? h : `${origin}${h}`));
      }

      // Deduplicate
      productUrls = [...new Set(productUrls)].slice(0, 20);

      if (productUrls.length === 0) {
        return status(422, {
          message:
            "No product links found on that page. Try pasting individual product URLs instead.",
        });
      }

      // Now scrape each product URL (reusing existing scrape logic)
      const results = await Promise.allSettled(
        productUrls.map((productUrl) => scrapeUrl(productUrl)),
      );

      ingestUsage("registry_scrape", {
        userId,
        metadata: { url: body.url, plan: user.plan ?? "free" },
      }).catch(() => {});

      return {
        sourceUrl: url,
        retailer: hostname,
        found: productUrls.length,
        items: results.map((r) =>
          r.status === "fulfilled"
            ? r.value
            : { url: "", error: "Unknown error" },
        ),
      };
    },
    {
      body: t.Object({ url: t.String() }),
    },
  )

  // ── Public routes (no auth — guest-facing) ────────────────────────

  // GET /api/registry/public/:slug — get registry for a event by slug (guests)
  // Returns items with claim counts, but NOT claim tokens
  .get("/public/:slug", async ({ params, status }) => {
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, params.slug))
      .limit(1);
    if (!event) return status(404, { message: "Not found" });

    const items = await db
      .select()
      .from(registryItems)
      .where(eq(registryItems.eventId, event.id))
      .orderBy(registryItems.sortOrder, registryItems.createdAt);

    const claims = await db
      .select()
      .from(registryClaims)
      .where(eq(registryClaims.eventId, event.id));

    // Attach claim summary to each item — expose purchased count, not tokens
    const itemsWithClaims = items.map((item) => {
      const itemClaims = claims.filter((c) => c.itemId === item.id);
      return {
        ...item,
        reservedCount: itemClaims.filter((c) => c.status === "reserved").length,
        purchasedCount: itemClaims.filter((c) => c.status === "purchased")
          .length,
        totalClaimed: itemClaims.length,
      };
    });

    return itemsWithClaims;
  })

  // POST /api/registry/claim — guest reserves an item
  .post(
    "/claim",
    async ({ body, status }) => {
      const [item] = await db
        .select({
          quantity: registryItems.quantity,
          eventId: registryItems.eventId,
        })
        .from(registryItems)
        .where(eq(registryItems.id, body.itemId))
        .limit(1);
      if (!item) return status(404, { message: "Item not found" });

      // Check availability
      const existingClaims = await db
        .select({ id: registryClaims.id })
        .from(registryClaims)
        .where(eq(registryClaims.itemId, body.itemId));

      if (existingClaims.length >= (item.quantity ?? 1)) {
        return status(409, { message: "This item has already been claimed" });
      }

      const claimToken = nanoid(16);

      const [claim] = await db
        .insert(registryClaims)
        .values({
          itemId: body.itemId,
          eventId: item.eventId,
          guestName: body.guestName,
          claimToken,
          status: "reserved",
        })
        .returning();

      // Return the token to the client — they store it in localStorage
      return { success: true, claimToken, claimId: claim.id };
    },
    {
      body: t.Object({
        itemId: t.String(),
        guestName: t.String({ minLength: 1 }),
      }),
    },
  )

  // POST /api/registry/confirm-purchase — guest marks as purchased
  // They must present their claimToken
  .post(
    "/confirm-purchase",
    async ({ body, status }) => {
      const [claim] = await db
        .select()
        .from(registryClaims)
        .where(
          and(
            eq(registryClaims.claimToken, body.claimToken),
            eq(registryClaims.id, body.claimId),
          ),
        )
        .limit(1);

      if (!claim) return status(404, { message: "Claim not found" });
      if (claim.status === "purchased") return { success: true }; // idempotent

      await db
        .update(registryClaims)
        .set({ status: "purchased", purchasedAt: new Date() })
        .where(eq(registryClaims.id, body.claimId));

      return { success: true };
    },
    {
      body: t.Object({
        claimId: t.String(),
        claimToken: t.String(),
      }),
    },
  )

  // DELETE /api/registry/claim — guest unclaims (if they have the token)
  .delete(
    "/claim",
    async ({ body, status }) => {
      const [claim] = await db
        .select()
        .from(registryClaims)
        .where(
          and(
            eq(registryClaims.claimToken, body.claimToken),
            eq(registryClaims.id, body.claimId),
          ),
        )
        .limit(1);

      if (!claim) return status(404, { message: "Claim not found" });
      if (claim.status === "purchased") {
        return status(400, { message: "Cannot unclaim a purchased item" });
      }

      await db
        .delete(registryClaims)
        .where(eq(registryClaims.id, body.claimId));
      return { success: true };
    },
    {
      body: t.Object({
        claimId: t.String(),
        claimToken: t.String(),
      }),
    },
  );
