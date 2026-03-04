import bearer from "@elysiajs/bearer";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { JSDOM } from "jsdom";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { registryClaims, registryItems, weddings } from "@/db/schema";
import { getAuthUserId } from "@/server/auth";

export const registryRouter = new Elysia({ prefix: "/registry" })
  .use(bearer())

  // ── Owner routes (bearer auth required) ──────────────────────────

  // GET /api/registry/:weddingId — list all items for a wedding (owner)
  .get("/:weddingId", async ({ params, bearer, status }) => {
    const userId = await getAuthUserId(bearer);
    if (!userId) return status(401, { message: "Unauthorized" });

    // Verify ownership
    const [wedding] = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(
        and(eq(weddings.id, params.weddingId), eq(weddings.userId, userId)),
      )
      .limit(1);
    if (!wedding) return status(404, { message: "Not found" });

    const items = await db
      .select()
      .from(registryItems)
      .where(eq(registryItems.weddingId, params.weddingId))
      .orderBy(registryItems.sortOrder, registryItems.createdAt);

    return items;
  })

  // POST /api/registry/:weddingId — add item (owner)
  .post(
    "/:weddingId",
    async ({ params, body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [wedding] = await db
        .select({ id: weddings.id })
        .from(weddings)
        .where(
          and(eq(weddings.id, params.weddingId), eq(weddings.userId, userId)),
        )
        .limit(1);
      if (!wedding) return status(404, { message: "Not found" });

      const [item] = await db
        .insert(registryItems)
        .values({ weddingId: params.weddingId, ...body })
        .returning();

      return item;
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number()),
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
        .select({ weddingId: registryItems.weddingId })
        .from(registryItems)
        .where(eq(registryItems.id, params.itemId))
        .limit(1);
      if (!item) return status(404, { message: "Not found" });

      const [wedding] = await db
        .select({ id: weddings.id })
        .from(weddings)
        .where(
          and(eq(weddings.id, item.weddingId), eq(weddings.userId, userId)),
        )
        .limit(1);
      if (!wedding) return status(403, { message: "Forbidden" });

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
      .select({ weddingId: registryItems.weddingId })
      .from(registryItems)
      .where(eq(registryItems.id, params.itemId))
      .limit(1);
    if (!item) return status(404, { message: "Not found" });

    const [wedding] = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(and(eq(weddings.id, item.weddingId), eq(weddings.userId, userId)))
      .limit(1);
    if (!wedding) return status(403, { message: "Forbidden" });

    await db.delete(registryItems).where(eq(registryItems.id, params.itemId));
    return { success: true };
  })

  // POST /api/registry/scrape — scrape product info from URLs (owner)
  .post(
    "/scrape",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const urls = Array.isArray(body.urls) ? body.urls : [body.urls];
      if (urls.length > 20)
        return status(400, { message: "Max 20 URLs at once" });

      const results = await Promise.allSettled(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, {
              headers: {
                // Impersonate a real browser so retailers don't block us
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-GB,en;q=0.9",
              },
              signal: AbortSignal.timeout(8000),
            });

            if (!res.ok) return { url, error: "Failed to fetch" };

            const html = await res.text();
            const dom = new JSDOM(html);
            const doc = dom.window.document;

            const getMeta = (property: string) =>
              doc
                .querySelector(
                  `meta[property="${property}"], meta[name="${property}"]`,
                )
                ?.getAttribute("content") ?? null;

            // Extract OG tags
            const title =
              getMeta("og:title") ??
              doc.querySelector("title")?.textContent?.trim() ??
              null;
            const imageUrl = getMeta("og:image") ?? null;
            const description = getMeta("og:description") ?? null;
            const siteName = getMeta("og:site_name") ?? null;

            // Try to extract price from JSON-LD structured data
            let price: number | null = null;
            const scripts = doc.querySelectorAll(
              'script[type="application/ld+json"]',
            );
            for (const script of scripts) {
              try {
                const json = JSON.parse(script.textContent ?? "");
                const offers = json?.offers ?? json?.[0]?.offers;
                const priceRaw =
                  offers?.price ?? offers?.[0]?.price ?? json?.price ?? null;
                if (priceRaw) {
                  const parsed = parseFloat(
                    String(priceRaw).replace(/[^0-9.]/g, ""),
                  );
                  if (!isNaN(parsed)) {
                    price = Math.round(parsed * 100); // store in pence
                    break;
                  }
                }
              } catch {}
            }

            // Fallback: try common price meta tags
            if (!price) {
              const priceMeta =
                getMeta("product:price:amount") ??
                getMeta("twitter:data1") ??
                null;
              if (priceMeta) {
                const parsed = parseFloat(priceMeta.replace(/[^0-9.]/g, ""));
                if (!isNaN(parsed)) price = Math.round(parsed * 100);
              }
            }

            // Derive retailer from hostname
            const hostname = new URL(url).hostname.replace("www.", "");
            const retailerMap: Record<string, string> = {
              "amazon.co.uk": "Amazon",
              "amazon.com": "Amazon",
              "johnlewis.com": "John Lewis",
              "etsy.com": "Etsy",
              "ikea.com": "IKEA",
              "anthropologie.com": "Anthropologie",
              "crateandbarrel.com": "Crate & Barrel",
              "williams-sonoma.com": "Williams Sonoma",
              "target.com": "Target",
              "wayfair.com": "Wayfair",
              "notonthehighstreet.com": "Not On The High Street",
            };
            const retailer =
              siteName ??
              retailerMap[hostname] ??
              hostname.split(".")[0].charAt(0).toUpperCase() +
                hostname.split(".")[0].slice(1);

            return {
              url,
              title,
              imageUrl,
              description,
              price,
              retailer,
              productUrl: url,
            };
          } catch (e) {
            return { url, error: "Could not scrape this URL" };
          }
        }),
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

  // ── Public routes (no auth — guest-facing) ────────────────────────

  // GET /api/registry/public/:slug — get registry for a wedding by slug (guests)
  // Returns items with claim counts, but NOT claim tokens
  .get("/public/:slug", async ({ params, status }) => {
    const [wedding] = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.slug, params.slug))
      .limit(1);
    if (!wedding) return status(404, { message: "Not found" });

    const items = await db
      .select()
      .from(registryItems)
      .where(eq(registryItems.weddingId, wedding.id))
      .orderBy(registryItems.sortOrder, registryItems.createdAt);

    const claims = await db
      .select()
      .from(registryClaims)
      .where(eq(registryClaims.weddingId, wedding.id));

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
          weddingId: registryItems.weddingId,
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
          weddingId: item.weddingId,
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
