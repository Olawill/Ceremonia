import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/auth", () => ({
  getAuthUserId: vi.fn(),
}));

import { db } from "@/db";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const authed = getAuthUserId as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve([]) }),
    }),
  });
  mockDb.update.mockReturnValue({
    set: () => ({
      where: () => ({ returning: () => Promise.resolve([]) }),
    }),
  });
  mockDb.delete.mockReturnValue({
    where: () => Promise.resolve(),
  });
});

describe("GET /api/settings", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request("http://localhost/api/settings", { method: "GET" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with user data when authed", async () => {
    authed.mockResolvedValueOnce("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([{ email: "test@test.com", plan: "pro" }]),
        }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/settings", { method: "GET" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("test@test.com");
    expect(body.plan).toBe("pro");
  });

  it("returns 404 when user not in DB", async () => {
    authed.mockResolvedValueOnce("user-ghost");
    // beforeEach already returns [] — no override needed
    const res = await app.handle(
      new Request("http://localhost/api/settings", { method: "GET" }),
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/settings/account", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 and deletes account when authed", async () => {
    authed.mockResolvedValueOnce("user-123");

    const res = await app.handle(
      new Request("http://localhost/api/settings/account", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("PATCH /api/settings", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValueOnce(null);
    const res = await app.handle(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: "My Brand" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns updated user on successful PATCH", async () => {
    authed.mockResolvedValue("user-123");
    const updated = {
      email: "test@test.com",
      plan: "agency",
      brandName: "MyBrand",
    };
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve([updated]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: "MyBrand" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.brandName).toBe("MyBrand");
  });
});
