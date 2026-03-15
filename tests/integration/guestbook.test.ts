import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks (must be before imports) ──────────────────────────────────────────

vi.mock("@/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/server/auth", () => ({ getAuthUserId: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  }),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

// ── Types ────────────────────────────────────────────────────────────────────

type MockDb = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
const mockDb = db as unknown as MockDb;
const authed = getAuthUserId as ReturnType<typeof vi.fn>;

// ── Request helper ────────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  body?: unknown,
  withAuth = false,
): Promise<{ status: number; body: unknown }> {
  const res = await app.handle(
    new Request(`http://localhost/api/guestbook${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(withAuth ? { Authorization: "Bearer test-token" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  );
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

// ── DB chain helpers ──────────────────────────────────────────────────────────

function selectReturning(rows: unknown[]) {
  return {
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(rows),
        orderBy: () => Promise.resolve(rows),
      }),
      orderBy: () => Promise.resolve(rows),
    }),
  };
}

function insertReturning(rows: unknown[]) {
  return { values: () => ({ returning: () => Promise.resolve(rows) }) };
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(selectReturning([]));
  mockDb.insert.mockReturnValue(insertReturning([]));
  mockDb.delete.mockReturnValue({ where: () => Promise.resolve() });
});

// ── GET /:weddingSlug ─────────────────────────────────────────────────────────

describe("GET /api/guestbook/:weddingSlug", () => {
  it("returns 404 when wedding does not exist", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("GET", "/unknown-slug");
    expect(r.status).toBe(404);
    expect((r.body as { message: string }).message).toMatch(/not found/i);
  });

  it("returns 403 when guest book is disabled", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "wedding-1", guestBookEnabled: false }]),
    );
    const r = await req("GET", "/james-sarah");
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/not enabled/i);
  });

  it("returns 200 with messages array when enabled", async () => {
    const messages = [
      {
        id: "msg-1",
        name: "Jane",
        message: "Congratulations!",
        weddingId: "wedding-1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "msg-2",
        name: "Bob",
        message: "Best wishes!",
        weddingId: "wedding-1",
        createdAt: new Date().toISOString(),
      },
    ];
    // First select — wedding lookup
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "wedding-1", guestBookEnabled: true }]),
    );
    // Second select — messages
    mockDb.select.mockReturnValueOnce(selectReturning(messages));
    const r = await req("GET", "/james-sarah");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect((r.body as unknown[]).length).toBe(2);
  });

  it("returns 200 with empty array when no messages yet", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([{ id: "wedding-1", guestBookEnabled: true }]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("GET", "/james-sarah");
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });
});

// ── POST /:weddingSlug ────────────────────────────────────────────────────────

describe("POST /api/guestbook/:weddingSlug", () => {
  const validBody = {
    name: "Jane Doe",
    message: "Wishing you both all the happiness!",
  };

  it("returns 404 when wedding does not exist", async () => {
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("POST", "/unknown-slug", validBody);
    expect(r.status).toBe(404);
  });

  it("returns 403 when guest book is disabled", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([
        { id: "wedding-1", userId: "user-1", guestBookEnabled: false },
      ]),
    );
    const r = await req("POST", "/james-sarah", validBody);
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/not enabled/i);
  });

  it("returns 403 when owner is on free plan (Pro required)", async () => {
    // Wedding lookup
    mockDb.select.mockReturnValueOnce(
      selectReturning([
        { id: "wedding-1", userId: "user-1", guestBookEnabled: true },
      ]),
    );
    // Owner plan lookup
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "free" }]));
    const r = await req("POST", "/james-sarah", validBody);
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/Pro plan/i);
  });

  it("returns 403 when owner is on starter plan (Pro required)", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([
        { id: "wedding-1", userId: "user-1", guestBookEnabled: true },
      ]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "starter" }]));
    const r = await req("POST", "/james-sarah", validBody);
    expect(r.status).toBe(403);
  });

  it("returns 200 and created entry for pro plan", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([
        { id: "wedding-1", userId: "user-1", guestBookEnabled: true },
      ]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "pro" }]));
    const created = {
      id: "msg-new",
      name: "Jane Doe",
      message: "Wishing you both all the happiness!",
      weddingId: "wedding-1",
    };
    mockDb.insert.mockReturnValueOnce(insertReturning([created]));
    const r = await req("POST", "/james-sarah", validBody);
    expect(r.status).toBe(200);
    expect((r.body as { name: string }).name).toBe("Jane Doe");
  });

  it("returns 200 and created entry for agency plan", async () => {
    mockDb.select.mockReturnValueOnce(
      selectReturning([
        { id: "wedding-1", userId: "user-1", guestBookEnabled: true },
      ]),
    );
    mockDb.select.mockReturnValueOnce(selectReturning([{ plan: "agency" }]));
    const created = {
      id: "msg-new",
      name: "John",
      message: "Congrats!",
      weddingId: "wedding-1",
    };
    mockDb.insert.mockReturnValueOnce(insertReturning([created]));
    const r = await req("POST", "/james-sarah", {
      name: "John",
      message: "Congrats!",
    });
    expect(r.status).toBe(200);
  });

  it("returns 422 when name is empty", async () => {
    const r = await req("POST", "/james-sarah", {
      name: "",
      message: "Hello!",
    });
    expect(r.status).toBe(422);
  });

  it("returns 422 when message is empty", async () => {
    const r = await req("POST", "/james-sarah", { name: "Jane", message: "" });
    expect(r.status).toBe(422);
  });

  it("returns 422 when body fields are missing", async () => {
    const r = await req("POST", "/james-sarah", {});
    expect(r.status).toBe(422);
  });
});

// ── DELETE /:weddingSlug/:messageId ──────────────────────────────────────────

describe("DELETE /api/guestbook/:weddingSlug/:messageId", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await req("DELETE", "/james-sarah/msg-1", undefined, true);
    expect(r.status).toBe(401);
  });

  it("returns 404 when wedding not found", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([]));
    const r = await req("DELETE", "/unknown-slug/msg-1", undefined, true);
    expect(r.status).toBe(404);
  });

  it("returns 200 and deletes message on success", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(selectReturning([{ id: "wedding-1" }]));
    const r = await req("DELETE", "/james-sarah/msg-1", undefined, true);
    expect(r.status).toBe(200);
    expect((r.body as { success: boolean }).success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalledOnce();
  });

  it("calls delete without auth header and returns 401", async () => {
    authed.mockResolvedValue(null);
    const r = await req("DELETE", "/james-sarah/msg-1");
    expect(r.status).toBe(401);
  });
});
