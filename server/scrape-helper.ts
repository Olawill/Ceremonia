import { JSDOM } from "jsdom";

// ── Shared scrape logic ───────────────────────────────────────────────────────

interface ScrapedProduct {
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  price: number | null; // in pence/cents
  retailer: string | null;
}

/** Extract product data from raw HTML using OG tags + JSON-LD */
function extractFromHtml(html: string, url: string): ScrapedProduct {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const getMeta = (property: string) =>
    doc
      .querySelector(`meta[property="${property}"], meta[name="${property}"]`)
      ?.getAttribute("content") ?? null;

  const title =
    getMeta("og:title") ??
    doc.querySelector("title")?.textContent?.trim() ??
    null;
  const imageUrl = getMeta("og:image") ?? null;
  const description = getMeta("og:description") ?? null;
  const siteName = getMeta("og:site_name") ?? null;

  let price: number | null = null;

  // JSON-LD structured data
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent ?? "");
      const offers = json?.offers ?? json?.[0]?.offers;
      const priceRaw =
        offers?.price ?? offers?.[0]?.price ?? json?.price ?? null;
      if (priceRaw) {
        const parsed = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) {
          price = Math.round(parsed * 100);
          break;
        }
      }
    } catch {}
  }

  // Fallback meta price tags
  if (!price) {
    const priceMeta =
      getMeta("product:price:amount") ?? getMeta("twitter:data1") ?? null;
    if (priceMeta) {
      const parsed = parseFloat(priceMeta.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) price = Math.round(parsed * 100);
    }
  }

  const hostname = new URL(url).hostname.replace("www.", "");
  const retailerMap: Record<string, string> = {
    "amazon.co.uk": "Amazon",
    "amazon.com": "Amazon",
    "bestbuy.ca": "Best Buy",
    "bestbuy.com": "Best Buy",
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

  return { title, imageUrl, description, price, retailer };
}

/**
 * Claude fallback — used when HTML scrape returns no title (JS-rendered pages).
 * Sends the URL + whatever HTML we have to Claude and asks it to extract
 * product data as JSON.
 */
async function extractWithClaude(
  url: string,
  htmlSnippet: string,
): Promise<ScrapedProduct> {
  // Trim HTML to first 15k chars to stay within token budget
  const trimmed = htmlSnippet.slice(0, 15000);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system:
        "You are a product data extractor. Extract product information from the provided URL and HTML snippet. Return ONLY valid JSON with no markdown, no backticks, no explanation. If you cannot determine a value, use null.",
      messages: [
        {
          role: "user",
          content: `Extract product data from this page.

URL: ${url}

HTML snippet (may be incomplete if JS-rendered):
${trimmed}

Return JSON in exactly this shape:
{
  "title": "Product name",
  "price": 4999,
  "currency": "GBP",
  "imageUrl": "https://...",
  "description": "Short description",
  "retailer": "Retailer name"
}

price should be an integer in pence/cents (e.g. £49.99 = 4999). Use null if unknown.
Infer the retailer from the URL domain if not obvious from the HTML.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("Claude API error");

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      title: parsed.title ?? null,
      imageUrl: parsed.imageUrl ?? null,
      description: parsed.description ?? null,
      price: typeof parsed.price === "number" ? parsed.price : null,
      retailer: parsed.retailer ?? null,
    };
  } catch {
    return {
      title: null,
      imageUrl: null,
      description: null,
      price: null,
      retailer: null,
    };
  }
}

/**
 * Jina AI Reader fallback — sends the URL to Jina's hosted browser
 * (r.jina.ai) which renders JS-heavy pages server-side and returns
 * clean text/markdown. Free, no API key needed, works on BestBuy etc.
 * Slower than HTML fetch (~2-4s) but faster than launching Playwright.
 */
async function extractWithJina(url: string): Promise<ScrapedProduct> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const res = await fetch(jinaUrl, {
    headers: {
      Accept: "application/json", // returns structured JSON instead of markdown
      "X-Return-Format": "json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

  const json = await res.json();

  // Jina JSON response shape:
  // { data: { title, url, content, description, images: { src, alt }[] } }
  const data = json?.data ?? {};

  const title: string | null = data.title ?? null;
  const description: string | null = data.description ?? null;

  // Jina returns images as an object keyed by URL — grab the first one
  let imageUrl: string | null = null;
  if (data.images && typeof data.images === "object") {
    const firstKey = Object.keys(data.images)[0];
    if (firstKey) imageUrl = firstKey;
  }

  // Price — Jina returns the rendered page content as markdown text,
  // so we scan it for price patterns like $49.99, £199, CAD 1,299.00
  let price: number | null = null;
  const content: string = data.content ?? "";
  const priceMatch = content.match(
    /(?:CAD|USD|GBP|EUR|£|\$|€)\s*[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*(?:CAD|USD|GBP|EUR)/i,
  );
  if (priceMatch) {
    const raw = priceMatch[0].replace(/[^0-9.]/g, "");
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      price = Math.round(parsed * 100);
    }
  }

  // Retailer from hostname
  const hostname = new URL(url).hostname.replace("www.", "");
  const retailerMap: Record<string, string> = {
    "bestbuy.ca": "Best Buy",
    "bestbuy.com": "Best Buy",
    "amazon.co.uk": "Amazon",
    "amazon.com": "Amazon",
    "johnlewis.com": "John Lewis",
    "etsy.com": "Etsy",
    "ikea.com": "IKEA",
    "walmart.com": "Walmart",
    "target.com": "Target",
    "wayfair.com": "Wayfair",
    "notonthehighstreet.com": "Not On The High Street",
  };
  const retailer =
    retailerMap[hostname] ??
    hostname.split(".")[0].charAt(0).toUpperCase() +
      hostname.split(".")[0].slice(1);

  return { title, imageUrl, description, price, retailer };
}

/**
 * Playwright fallback — launches a real Chromium browser to render JS-heavy
 * pages (BestBuy, Walmart, etc.) that return empty HTML shells to fetch().
 * Only called when HTML scrape returns no title.
 */
// async function extractWithPlaywright(url: string): Promise<ScrapedProduct> {
//   const { chromium } = await import("playwright-core");

//   const browser = await chromium.launch({ headless: true });
//   try {
//     const page = await browser.newPage();

//     // Block images/fonts/media to speed up load — we only need the DOM
//     await page.route("**/*", (route) => {
//       const type = route.request().resourceType();
//       if (["image", "font", "media", "stylesheet"].includes(type)) {
//         return route.abort();
//       }
//       return route.continue();
//     });

//     await page.goto(url, {
//       waitUntil: "domcontentloaded",
//       timeout: 20000,
//     });

//     // Wait for common product title selectors to appear
//     await page
//       .waitForSelector(
//         'h1, [data-testid*="title"], [class*="product-title"], [class*="productTitle"]',
//         { timeout: 8000 },
//       )
//       .catch(() => {}); // timeout is fine — grab whatever rendered

//     const result = await page.evaluate(() => {
//       const getMeta = (prop: string) =>
//         document
//           .querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)
//           ?.getAttribute("content") ?? null;

//       // Title — OG tag first, then h1, then <title>
//       const title =
//         getMeta("og:title") ??
//         document.querySelector("h1")?.textContent?.trim() ??
//         document.querySelector("title")?.textContent?.trim() ??
//         null;

//       const imageUrl = getMeta("og:image") ?? null;
//       const description = getMeta("og:description") ?? null;
//       const siteName = getMeta("og:site_name") ?? null;

//       // JSON-LD price
//       let price: number | null = null;
//       const scripts = document.querySelectorAll(
//         'script[type="application/ld+json"]',
//       );
//       for (const script of Array.from(scripts)) {
//         try {
//           const json = JSON.parse(script.textContent ?? "");
//           const offers = json?.offers ?? json?.[0]?.offers;
//           const priceRaw =
//             offers?.price ?? offers?.[0]?.price ?? json?.price ?? null;
//           if (priceRaw) {
//             const parsed = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ""));
//             if (!isNaN(parsed)) {
//               price = Math.round(parsed * 100);
//               break;
//             }
//           }
//         } catch {}
//       }

//       // Fallback — look for common price element patterns in the rendered DOM
//       if (!price) {
//         const priceSelectors = [
//           '[data-testid*="price"]',
//           '[class*="price"]:not([class*="original"]):not([class*="was"])',
//           '[class*="Price"]:not([class*="Original"]):not([class*="Was"])',
//           '[itemprop="price"]',
//         ];
//         for (const sel of priceSelectors) {
//           const el = document.querySelector(sel);
//           if (el) {
//             const text = el.getAttribute("content") ?? el.textContent ?? "";
//             const parsed = parseFloat(text.replace(/[^0-9.]/g, ""));
//             if (!isNaN(parsed) && parsed > 0) {
//               price = Math.round(parsed * 100);
//               break;
//             }
//           }
//         }
//       }

//       return { title, imageUrl, description, siteName, price };
//     });

//     // Derive retailer from hostname
//     const hostname = new URL(url).hostname.replace("www.", "");
//     const retailerMap: Record<string, string> = {
//       "bestbuy.ca": "Best Buy",
//       "bestbuy.com": "Best Buy",
//       "amazon.co.uk": "Amazon",
//       "amazon.com": "Amazon",
//       "johnlewis.com": "John Lewis",
//       "etsy.com": "Etsy",
//       "ikea.com": "IKEA",
//       "walmart.com": "Walmart",
//       "target.com": "Target",
//       "wayfair.com": "Wayfair",
//     };
//     const retailer =
//       result.siteName ??
//       retailerMap[hostname] ??
//       hostname.split(".")[0].charAt(0).toUpperCase() +
//         hostname.split(".")[0].slice(1);

//     return {
//       title: result.title,
//       imageUrl: result.imageUrl,
//       description: result.description,
//       price: result.price,
//       retailer,
//     };
//   } finally {
//     await browser.close();
//   }
// }

/**
 * Master scrape function — tries HTML extraction first, falls back to Claude
 * if the page appears to be JS-rendered (no title extracted).
 */
export async function scrapeUrl(
  url: string,
): Promise<ScrapedProduct & { url: string; error?: string }> {
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      try {
        const jinaResult = await extractWithJina(url);
        if (jinaResult.title) return { url, ...jinaResult };
      } catch {}

      if (process.env.NODE_ENV === "production") {
        const claudeResult = await extractWithClaude(url, "").catch(() => null);
        if (claudeResult?.title) return { url, ...claudeResult };
      }

      return {
        url,
        title: null,
        imageUrl: null,
        description: null,
        price: null,
        retailer: null,
        error: "Failed to fetch",
      };
    }

    html = await res.text();
  } catch {
    return {
      url,
      title: null,
      imageUrl: null,
      description: null,
      price: null,
      retailer: null,
      error: "Could not reach URL",
    };
  }

  // Try HTML extraction first
  const htmlResult = extractFromHtml(html, url);

  // If we got a meaningful title, HTML scrape succeeded
  if (htmlResult.title && htmlResult.title.length > 3) {
    return { url, ...htmlResult };
  }

  // Page appears JS-rendered — try Jina next
  try {
    const jinaResult = await extractWithJina(url);
    if (jinaResult.title && jinaResult.title.length > 3) {
      return {
        url,
        title: jinaResult.title ?? htmlResult.title,
        imageUrl: jinaResult.imageUrl ?? htmlResult.imageUrl,
        description: jinaResult.description ?? htmlResult.description,
        price: jinaResult.price ?? htmlResult.price,
        retailer: jinaResult.retailer ?? htmlResult.retailer,
      };
    }
  } catch {
    // Jina failed — fall through
  }

  // Production only: Claude as final fallback
  // Development: return whatever we have (avoid Claude costs during dev)
  if (process.env.NODE_ENV === "production") {
    try {
      const claudeResult = await extractWithClaude(url, html);
      return {
        url,
        title: claudeResult.title ?? htmlResult.title,
        imageUrl: claudeResult.imageUrl ?? htmlResult.imageUrl,
        description: claudeResult.description ?? htmlResult.description,
        price: claudeResult.price ?? htmlResult.price,
        retailer: claudeResult.retailer ?? htmlResult.retailer,
      };
    } catch {
      // Claude failed too — fall through
    }
  }

  return { url, ...htmlResult };
}
