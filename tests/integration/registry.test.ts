import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks (must be before imports) ──────────────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/auth", () => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/polar-usage", () => ({
  ingestUsage: vi.fn().mockResolvedValue(undefined),
}));

// nanoid is used to generate claimTokens — fix it so we can assert on it
vi.mock("nanoid", () => ({ nanoid: () => "test-claim-token-16" }));

// ── Imports ──────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

// ── Typed helpers ────────────────────────────────────────────────────────────

type MockDb = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockDb = db as unknown as MockDb;
const authed = getAuthUserId as ReturnType<typeof vi.fn>;

// ── Request helper ───────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const url = `http://localhost/api/registry${path}`;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const res = await app.handle(new Request(url, init));
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

// ── Shared DB chain builders ─────────────────────────────────────────────────

/** Builds a db.select() chain returning the given rows at the final call */
function selectReturning(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const leaf = Promise.resolve(rows);
  chain.from = () => ({
    where: () => ({
      limit: () => leaf,
      orderBy: () => leaf,
    }),
    orderBy: () => leaf,
  });
  return chain;
}

function insertReturning(rows: unknown[]) {
  return {
    values: () => ({ returning: () => Promise.resolve(rows) }),
  };
}

function updateReturning(rows: unknown[]) {
  return {
    set: () => ({
      where: () => ({ returning: () => Promise.resolve(rows) }),
    }),
  };
}

function deleteWhere() {
  return { where: () => Promise.resolve() };
}

// ── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Safe no-op defaults
  mockDb.select.mockReturnValue(selectReturning([]));
  mockDb.insert.mockReturnValue(insertReturning([]));
  mockDb.update.mockReturnValue(updateReturning([]));
  mockDb.delete.mockReturnValue(deleteWhere());
});

// ── GET /:eventId ──────────────────────────────────────────────────────────

describe("GET /api/registry/:eventId", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("GET", "/event-uuid-1");
    expect(r.status).toBe(401);
  });

  it("returns 404 when event not found or not owned", async () => {
    authed.mockResolvedValue("user-1");
    // First select (ownership check) returns empty
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("GET", "/event-uuid-1");
    expect(r.status).toBe(404);
  });

  it("returns 200 with items array", async () => {
    authed.mockResolvedValue("user-1");
    const mockEvent = { id: "event-uuid-1" };
    const mockItems = [
      { id: "item-1", title: "KitchenAid Mixer", eventId: "event-uuid-1" },
      { id: "item-2", title: "Le Creuset Set", eventId: "event-uuid-1" },
    ];
    // First select → ownership check
    mockDb.select.mockReturnValueOnce(selectReturning([mockEvent]));
    // Second select → items list
    mockDb.select.mockReturnValueOnce(selectReturning(mockItems));
    const r = await req("GET", "/event-uuid-1");
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(2);
  });
});

// ── POST /:eventId ─────────────────────────────────────────────────────────

describe("POST /api/registry/:eventId", () => {
  const validItem = { title: "Dyson Vacuum" };

  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("POST", "/event-uuid-1", validItem);
    expect(r.status).toBe(401);
  });

  it("returns 404 when event not found or not owned", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("POST", "/event-uuid-1", validItem);
    expect(r.status).toBe(404);
  });

  it("returns 422 when title is empty", async () => {
    authed.mockResolvedValue("user-1");
    const r = await req("POST", "/event-uuid-1", { title: "" });
    expect(r.status).toBe(422);
  });

  it("returns 403 when free plan hits registry item limit (10)", async () => {
    authed.mockResolvedValue("user-1");
    // Event ownership check passes
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    // Owner plan = free
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "free" }]));
    // Item count = 10 (at limit)
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ itemCount: 10 }]),
      }),
    });
    const r = await req("POST", "/event-uuid-1", validItem);
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/maximum of 10/);
  });

  it("returns 200 and created item for starter plan (limit not hit)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    // Starter plan — limit is 30
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    // Item count = 5 (below limit)
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ itemCount: 5 }]),
      }),
    });
    const createdItem = {
      id: "item-new",
      title: "Dyson Vacuum",
      eventId: "event-uuid-1",
    };
    mockDb.insert.mockReturnValueOnce(insertReturning([createdItem]));
    const r = await req("POST", "/event-uuid-1", validItem);
    expect(r.status).toBe(200);
    expect((r.body as { title: string }).title).toBe("Dyson Vacuum");
  });

  it("returns 200 for pro plan (unlimited items)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    // Pro plan — registryItemLimit is Infinity, count check is skipped
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "pro" }]));
    const createdItem = { id: "item-new", title: "Dyson Vacuum" };
    mockDb.insert.mockReturnValueOnce(insertReturning([createdItem]));
    const r = await req("POST", "/event-uuid-1", validItem);
    expect(r.status).toBe(200);
  });
});

// ── PATCH /item/:itemId ──────────────────────────────────────────────────────

describe("PATCH /api/registry/item/:itemId", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("PATCH", "/item/item-uuid-1", { title: "Updated" });
    expect(r.status).toBe(401);
  });

  it("returns 404 when item not found", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("PATCH", "/item/item-uuid-1", { title: "Updated" });
    expect(r.status).toBe(404);
  });

  it("returns 403 when item belongs to another user's event", async () => {
    authed.mockResolvedValue("user-1");
    // Item exists
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ eventId: "event-other" }]),
    );
    // Ownership check fails — event belongs to different user
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("PATCH", "/item/item-uuid-1", { title: "Updated" });
    expect(r.status).toBe(403);
  });

  it("returns 200 with updated item", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ eventId: "event-uuid-1" }]),
    );
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    const updated = { id: "item-uuid-1", title: "Updated Title" };
    mockDb.update.mockReturnValueOnce(updateReturning([updated]));
    const r = await req("PATCH", "/item/item-uuid-1", {
      title: "Updated Title",
    });
    expect(r.status).toBe(200);
    expect((r.body as { title: string }).title).toBe("Updated Title");
  });
});

// ── DELETE /item/:itemId ─────────────────────────────────────────────────────

describe("DELETE /api/registry/item/:itemId", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("DELETE", "/item/item-uuid-1");
    expect(r.status).toBe(401);
  });

  it("returns 404 when item not found", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("DELETE", "/item/item-uuid-1");
    expect(r.status).toBe(404);
  });

  it("returns 403 when item belongs to another user", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ eventId: "event-other" }]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("DELETE", "/item/item-uuid-1");
    expect(r.status).toBe(403);
  });

  it("returns 200 on success", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ eventId: "event-uuid-1" }]),
    );
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    const r = await req("DELETE", "/item/item-uuid-1");
    expect(r.status).toBe(200);
    expect((r.body as { success: boolean }).success).toBe(true);
  });
});

// ── POST /scrape ─────────────────────────────────────────────────────────────

describe("POST /api/registry/scrape", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("POST", "/scrape", { urls: ["https://example.com"] });
    expect(r.status).toBe(401);
  });

  it("returns 403 when free plan (registryScraper: false)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "free" }]));
    const r = await req("POST", "/scrape", { urls: ["https://example.com"] });
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/Starter plan/);
  });

  it("returns 400 when more than 20 URLs provided", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    const urls = Array.from(
      { length: 21 },
      (_, i) => `https://example.com/${i}`,
    );
    const r = await req("POST", "/scrape", { urls });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/Max 20/);
  });

  it("returns 200 for starter plan with valid URLs (fetch mocked)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    // Mock global fetch to return a minimal HTML page with OG tags
    const mockHtml = `
      <html><head>
        <meta property="og:title" content="Test Product" />
        <meta property="og:image" content="https://example.com/img.jpg" />
      </head><body></body></html>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      }),
    );
    const r = await req("POST", "/scrape", {
      urls: ["https://example.com/product"],
    });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    vi.unstubAllGlobals();
  });
});

// ── POST /scrape-page ────────────────────────────────────────────────────────

describe("POST /api/registry/scrape-page", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("POST", "/scrape-page", {
      url: "https://amazon.co.uk/s?k=gifts",
    });
    expect(r.status).toBe(401);
  });

  it("returns 403 when plan is below agency", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "pro" }]));
    const r = await req("POST", "/scrape-page", {
      url: "https://amazon.co.uk/s?k=gifts",
    });
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/Agency/);
  });

  it("returns 400 when the URL cannot be fetched", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "agency" }]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const r = await req("POST", "/scrape-page", {
      url: "https://amazon.co.uk/s?k=gifts",
    });
    expect(r.status).toBe(400);
    vi.unstubAllGlobals();
  });
});

// ── GET /public/:slug ────────────────────────────────────────────────────────

describe("GET /api/registry/public/:slug", () => {
  it("returns 404 for unknown slug", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("GET", "/public/unknown-slug");
    expect(r.status).toBe(404);
  });

  it("returns 200 with items including claim counts but no tokens", async () => {
    const mockEvent = { id: "event-uuid-1" };
    const mockItems = [
      { id: "item-1", title: "KitchenAid", eventId: "event-uuid-1" },
    ];
    const mockClaims = [
      {
        id: "claim-1",
        itemId: "item-1",
        eventId: "event-uuid-1",
        status: "reserved",
        claimToken: "secret-token",
      },
    ];

    // Select 1: event by slug — ends in .limit()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([mockEvent]) }),
      }),
    });
    // Select 2: items — ends in .orderBy()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ orderBy: () => Promise.resolve(mockItems) }),
      }),
    });
    // Select 3: claims — ends in .where() directly
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(mockClaims) }),
    });

    const r = await req("GET", "/public/some-slug");
    expect(r.status).toBe(200);
    const items = r.body as Array<{
      id: string;
      reservedCount: number;
      purchasedCount: number;
      totalClaimed: number;
      claimToken?: string;
    }>;
    expect(items).toHaveLength(1);
    expect(items[0].reservedCount).toBe(1);
    expect(items[0].purchasedCount).toBe(0);
    expect(items[0].totalClaimed).toBe(1);
    // claimToken must NOT be exposed
    expect(items[0].claimToken).toBeUndefined();
  });
});

// ── POST /claim ──────────────────────────────────────────────────────────────

describe("POST /api/registry/claim", () => {
  const validClaim = { itemId: "item-uuid-1", guestName: "Jane Smith" };

  it("returns 404 when item not found", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("POST", "/claim", validClaim);
    expect(r.status).toBe(404);
  });

  it("returns 409 when item is fully claimed", async () => {
    // Select 1: item lookup — ends in .limit()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ quantity: 1, eventId: "event-uuid-1" }]),
        }),
      }),
    });
    // Select 2: existing claims — ends in .where() directly (no limit)
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ id: "claim-existing" }]),
      }),
    });

    const r = await req("POST", "/claim", validClaim);
    expect(r.status).toBe(409);
    expect((r.body as { message: string }).message).toMatch(
      /already been claimed/,
    );
  });

  it("returns 200 with claimToken and claimId on success", async () => {
    // Select 1: item lookup — ends in .limit()
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ quantity: 2, eventId: "event-uuid-1" }]),
        }),
      }),
    });
    // Select 2: existing claims — ends in .where() directly (no limit)
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    });
    mockDb.insert.mockReturnValueOnce(
      insertReturning([{ id: "claim-new", claimToken: "test-claim-token-16" }]),
    );
    const r = await req("POST", "/claim", validClaim);
    expect(r.status).toBe(200);
    const body = r.body as {
      success: boolean;
      claimToken: string;
      claimId: string;
    };
    expect(body.success).toBe(true);
    expect(body.claimToken).toBe("test-claim-token-16");
    expect(body.claimId).toBe("claim-new");
  });
});

// ── POST /confirm-purchase ───────────────────────────────────────────────────

describe("POST /api/registry/confirm-purchase", () => {
  const validBody = {
    claimId: "claim-uuid-1",
    claimToken: "test-claim-token-16",
  };

  it("returns 404 when claim token is invalid", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("POST", "/confirm-purchase", validBody);
    expect(r.status).toBe(404);
  });

  it("returns 200 immediately when already purchased (idempotent)", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "claim-uuid-1", status: "purchased" }]),
    );
    const r = await req("POST", "/confirm-purchase", validBody);
    expect(r.status).toBe(200);
    expect((r.body as { success: boolean }).success).toBe(true);
    // Should NOT call update — idempotent
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns 200 and updates status to purchased", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "claim-uuid-1", status: "reserved" }]),
    );
    mockDb.update.mockReturnValueOnce(
      updateReturning([{ id: "claim-uuid-1", status: "purchased" }]),
    );
    const r = await req("POST", "/confirm-purchase", validBody);
    expect(r.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalledOnce();
  });
});

// ── DELETE /claim ────────────────────────────────────────────────────────────

describe("DELETE /api/registry/claim", () => {
  const validBody = {
    claimId: "claim-uuid-1",
    claimToken: "test-claim-token-16",
  };

  it("returns 404 when claim token is invalid", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("DELETE", "/claim", validBody);
    expect(r.status).toBe(404);
  });

  it("returns 400 when trying to unclaim a purchased item", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "claim-uuid-1", status: "purchased" }]),
    );
    const r = await req("DELETE", "/claim", validBody);
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/Cannot unclaim/);
  });

  it("returns 200 on successful unclaim", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "claim-uuid-1", status: "reserved" }]),
    );
    const r = await req("DELETE", "/claim", validBody);
    expect(r.status).toBe(200);
    expect((r.body as { success: boolean }).success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalledOnce();
  });
});

// ── POST /scrape — extended ───────────────────────────────────────────────────

describe("POST /api/registry/scrape — OG data extraction", () => {
  it("extracts og:title and og:image from scraped HTML", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    const html = `<html><head>
      <meta property="og:title" content="KitchenAid Mixer" />
      <meta property="og:image" content="https://cdn.example.com/mixer.jpg" />
      <meta property="og:description" content="Stand mixer in red" />
      <meta property="og:site_name" content="John Lewis" />
    </head><body></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }),
    );
    const r = await req("POST", "/scrape", {
      urls: ["https://johnlewis.com/p/123"],
    });
    expect(r.status).toBe(200);
    const results = r.body as Array<{
      title: string;
      imageUrl: string;
      retailer: string;
      description: string;
    }>;
    expect(results[0].title).toBe("KitchenAid Mixer");
    expect(results[0].imageUrl).toBe("https://cdn.example.com/mixer.jpg");
    expect(results[0].description).toBe("Stand mixer in red");
    expect(results[0].retailer).toBe("John Lewis");
    vi.unstubAllGlobals();
  });

  it("extracts price from JSON-LD structured data", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    const html = `<html><head>
      <meta property="og:title" content="Dyson V15" />
      <script type="application/ld+json">{"offers":{"price":"499.99","priceCurrency":"GBP"}}</script>
    </head><body></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }),
    );
    const r = await req("POST", "/scrape", {
      urls: ["https://amazon.co.uk/dp/B09ABC1234"],
    });
    expect(r.status).toBe(200);
    const results = r.body as Array<{ price: number }>;
    expect(results[0].price).toBe(49999); // stored in pence
    vi.unstubAllGlobals();
  });

  it("returns error object when fetch fails for a URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const r = await req("POST", "/scrape", {
      urls: ["https://example.com/product"],
    });
    expect(r.status).toBe(200);
    const results = r.body as Array<{ error: string }>;
    expect(results[0].error).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("accepts a single URL string (not array)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve("<html><head><title>Product</title></head></html>"),
      }),
    );
    const r = await req("POST", "/scrape", {
      urls: "https://example.com/product",
    });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    vi.unstubAllGlobals();
  });
});

// ── POST /scrape-page — agency success ───────────────────────────────────────

describe("POST /api/registry/scrape-page — agency success", () => {
  it("returns 200 with found products for agency plan (Amazon-style HTML)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "agency" }]));

    // Page HTML with Amazon-style product links
    const pageHtml = `<html><body>
      <a href="/dp/B09ABC1234">Product One</a>
      <a href="/dp/B09XYZ5678">Product Two</a>
    </body></html>`;

    // Product page HTML (returned for each scraped product link)
    const productHtml = `<html><head>
      <meta property="og:title" content="Amazon Product" />
      <meta property="og:image" content="https://cdn.amazon.co.uk/img.jpg" />
    </head><body></body></html>`;

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // First call: fetch the listing page
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(pageHtml),
        })
        // Subsequent calls: fetch individual product pages
        .mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(productHtml),
        }),
    );

    const r = await req("POST", "/scrape-page", {
      url: "https://www.amazon.co.uk/s?k=gifts",
    });
    expect(r.status).toBe(200);
    const body = r.body as {
      sourceUrl: string;
      found: number;
      items: unknown[];
    };
    expect(body.sourceUrl).toBe("https://www.amazon.co.uk/s?k=gifts");
    expect(body.found).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    vi.unstubAllGlobals();
  });

  it("returns 422 when no product links found on the page", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "agency" }]));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve("<html><body><p>No products here</p></body></html>"),
      }),
    );
    const r = await req("POST", "/scrape-page", {
      url: "https://example.com/empty-page",
    });
    expect(r.status).toBe(422);
    expect((r.body as { message: string }).message).toMatch(/No product links/);
    vi.unstubAllGlobals();
  });
});

// ── POST /registry/:eventId — additional edge cases ────────────────────────

describe("POST /api/registry/:eventId — edge cases", () => {
  it("returns 403 when starter plan hits item limit (30)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([{ itemCount: 30 }]) }),
    });
    const r = await req("POST", "/event-uuid-1", { title: "New Item" });
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/maximum of 30/);
  });

  it("creates item with all optional fields", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "event-uuid-1" }]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "pro" }]));
    const fullItem = {
      id: "item-full",
      title: "KitchenAid",
      description: "Red stand mixer",
      price: 49999,
      imageUrl: "https://cdn.example.com/img.jpg",
      productUrl: "https://johnlewis.com/p/123",
      retailer: "John Lewis",
      quantity: 2,
      category: "Kitchen",
      sortOrder: 1,
    };
    mockDb.insert.mockReturnValueOnce(insertReturning([fullItem]));
    const r = await req("POST", "/event-uuid-1", {
      title: "KitchenAid",
      description: "Red stand mixer",
      price: 49999,
      imageUrl: "https://cdn.example.com/img.jpg",
      productUrl: "https://johnlewis.com/p/123",
      retailer: "John Lewis",
      quantity: 2,
      category: "Kitchen",
      sortOrder: 1,
    });
    expect(r.status).toBe(200);
    expect((r.body as { retailer: string }).retailer).toBe("John Lewis");
    expect((r.body as { price: number }).price).toBe(49999);
  });
});

// ── GET /public/:slug — extended ─────────────────────────────────────────────

describe("GET /api/registry/public/:slug — extended", () => {
  it("returns items with mixed reserved and purchased counts", async () => {
    const mockEvent = { id: "event-uuid-1" };
    const mockItems = [
      { id: "item-1", title: "Mixer", eventId: "event-uuid-1" },
      { id: "item-2", title: "Blender", eventId: "event-uuid-1" },
    ];
    const mockClaims = [
      {
        id: "c1",
        itemId: "item-1",
        eventId: "event-uuid-1",
        status: "reserved",
        claimToken: "tok1",
      },
      {
        id: "c2",
        itemId: "item-1",
        eventId: "event-uuid-1",
        status: "purchased",
        claimToken: "tok2",
      },
      {
        id: "c3",
        itemId: "item-2",
        eventId: "event-uuid-1",
        status: "purchased",
        claimToken: "tok3",
      },
    ];
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([mockEvent]) }),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ orderBy: () => Promise.resolve(mockItems) }),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(mockClaims) }),
    });

    const r = await req("GET", "/public/some-slug");
    expect(r.status).toBe(200);
    const items = r.body as Array<{
      id: string;
      reservedCount: number;
      purchasedCount: number;
      totalClaimed: number;
    }>;
    const mixer = items.find((i) => i.id === "item-1")!;
    const blender = items.find((i) => i.id === "item-2")!;
    expect(mixer.reservedCount).toBe(1);
    expect(mixer.purchasedCount).toBe(1);
    expect(mixer.totalClaimed).toBe(2);
    expect(blender.purchasedCount).toBe(1);
    expect(blender.reservedCount).toBe(0);
  });

  it("never exposes claimToken on any item", async () => {
    const mockEvent = { id: "event-uuid-1" };
    const mockItems = [
      { id: "item-1", title: "Gift", eventId: "event-uuid-1" },
    ];
    const mockClaims = [
      {
        id: "c1",
        itemId: "item-1",
        eventId: "event-uuid-1",
        status: "reserved",
        claimToken: "super-secret",
      },
    ];
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([mockEvent]) }),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({ orderBy: () => Promise.resolve(mockItems) }),
      }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(mockClaims) }),
    });
    const r = await req("GET", "/public/some-slug");
    const items = r.body as Array<Record<string, unknown>>;
    expect(JSON.stringify(items)).not.toContain("super-secret");
  });
});
