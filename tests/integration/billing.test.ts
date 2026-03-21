import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/auth", () => ({ getAuthUserId: vi.fn() }));

vi.mock("@/lib/polar", () => ({
  polar: {
    checkouts: {
      create: vi.fn(),
    },
    customerSessions: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    POLAR_SERVER: "sandbox",
  },
}));

import { db } from "@/db";
import { polar } from "@/lib/polar";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

const authed = getAuthUserId as ReturnType<typeof vi.fn>;

const mockPolar = polar as unknown as {
  checkouts: { create: ReturnType<typeof vi.fn> };
  customerSessions: { create: ReturnType<typeof vi.fn> };
};

const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: empty DB result
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
        body: JSON.stringify({ productId: "prod_123" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 422 when body is missing productId", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns checkout URL when authed", async () => {
    authed.mockResolvedValue("user-123");
    mockPolar.checkouts.create.mockResolvedValue({
      url: "https://sandbox.polar.sh/checkout/session_abc",
    });

    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "prod_starter_monthly" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("polar.sh");
  });

  it("passes correct params to polar.checkouts.create", async () => {
    authed.mockResolvedValue("user-123");
    mockPolar.checkouts.create.mockResolvedValue({
      url: "https://sandbox.polar.sh/checkout/session_abc",
    });

    await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "prod_starter_monthly" }),
      }),
    );

    expect(mockPolar.checkouts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ["prod_starter_monthly"],
        externalCustomerId: "user-123",
        metadata: { userId: "user-123" },
      }),
    );
  });

  it("returns 500 when Polar API fails", async () => {
    authed.mockResolvedValue("user-123");
    mockPolar.checkouts.create.mockRejectedValue(new Error("Polar API down"));

    const res = await app.handle(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "prod_123" }),
      }),
    );

    expect(res.status).toBe(500);
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

  it("returns 400 when user has no polarCustomerId", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ polarCustomerId: null }]),
        }),
      }),
    });

    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when user not found in DB", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([]) }),
      }),
    });

    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );

    expect(res.status).toBe(400);
  });

  it("returns portal URL when polarCustomerId exists", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ polarCustomerId: "polar_cus_abc123" }]),
        }),
      }),
    });
    mockPolar.customerSessions.create.mockResolvedValue({
      customerPortalUrl: "https://sandbox.polar.sh/customer-portal/session_xyz",
    });

    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("polar.sh");
  });

  it("passes polarCustomerId to customerSessions.create", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ polarCustomerId: "polar_cus_abc123" }]),
        }),
      }),
    });
    mockPolar.customerSessions.create.mockResolvedValue({
      customerPortalUrl: "https://sandbox.polar.sh/customer-portal/session_xyz",
    });

    await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );

    expect(mockPolar.customerSessions.create).toHaveBeenCalledWith({
      customerId: "polar_cus_abc123",
    });
  });

  it("returns 500 when Polar API fails", async () => {
    authed.mockResolvedValue("user-123");
    mockSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ polarCustomerId: "polar_cus_abc123" }]),
        }),
      }),
    });
    mockPolar.customerSessions.create.mockRejectedValue(
      new Error("Polar API down"),
    );

    const res = await app.handle(
      new Request("http://localhost/api/billing/portal", { method: "POST" }),
    );

    expect(res.status).toBe(500);
  });
});
