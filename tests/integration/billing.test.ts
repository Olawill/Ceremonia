import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/auth", () => ({ getAuthUserId: vi.fn() }));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: { create: vi.fn() },
    },
    billingPortal: {
      sessions: { create: vi.fn() },
    },
  },
}));

import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

const authed = getAuthUserId as ReturnType<typeof vi.fn>;
const mockStripe = stripe as unknown as {
  checkout: { sessions: { create: ReturnType<typeof vi.fn> } };
  billingPortal: { sessions: { create: ReturnType<typeof vi.fn> } };
};

const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve([]) }),
    }),
  });
});

// ── POST /api/billing/checkout ────────────────────────────────────────────────

describe("POST /api/billing/checkout", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_123", mode: "subscription" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 422 when body is missing priceId", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription" }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 when mode is invalid", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_123", mode: "invalid" }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 404 when user not found in DB", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_123", mode: "subscription" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns checkout URL when user exists", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: "user-123",
                email: "test@test.com",
                stripeCustomerId: null,
              },
            ]),
        }),
      }),
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/session/abc",
    });
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_123", mode: "subscription" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("stripe.com");
  });
});

// ── POST /api/billing/portal ──────────────────────────────────────────────────

describe("POST /api/billing/portal", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when user has no stripe customer", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ stripeCustomerId: null }]),
        }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns portal URL when stripe customer exists", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ stripeCustomerId: "cus_abc123" }]),
        }),
      }),
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: "https://billing.stripe.com/session/portal_abc",
    });
    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("stripe.com");
  });
});
