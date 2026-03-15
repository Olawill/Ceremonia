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

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { db } from "@/db";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

const authed = getAuthUserId as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const validTheme = {
  key: "custom",
  name: "My Theme",
  curtain: "#1a1a2e",
  curtainDark: "#0d0d1a",
  curtainSheen: "#2a2a4e",
  gold: "#D4AF37",
  goldLight: "#F0D060",
  bg: "#0F0A0A",
  bgMid: "#1a1210",
  text: "#F5F0E8",
  particle: "#D4AF3780",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        orderBy: () => Promise.resolve([]),
      }),
    }),
  });
  mockDb.insert.mockReturnValue({
    values: () => ({ returning: () => Promise.resolve([]) }),
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

// ── GET /api/custom-themes ────────────────────────────────────────────────────

describe("GET /api/custom-themes", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", { method: "GET" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns empty array when user has no themes", async () => {
    authed.mockResolvedValue("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", { method: "GET" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns saved themes for authed user", async () => {
    authed.mockResolvedValue("user-123");
    const mockThemes = [{ id: "t1", name: "My Theme", theme: validTheme }];
    mockDb.select.mockReturnValue({
      from: () => ({ where: () => Promise.resolve(mockThemes) }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", { method: "GET" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

// ── POST /api/custom-themes ───────────────────────────────────────────────────

describe("POST /api/custom-themes", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", theme: validTheme }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is on free plan", async () => {
    authed.mockResolvedValue("user-123");
    // First select call returns free plan user
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ plan: "free" }]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Theme", theme: validTheme }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 422 when name is empty", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", theme: validTheme }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("creates theme for pro user", async () => {
    authed.mockResolvedValue("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ plan: "pro" }]) }),
      }),
    });
    const created = { id: "t1", name: "My Theme", theme: validTheme };
    mockDb.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([created]) }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Theme", theme: validTheme }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("My Theme");
  });
});

// ── DELETE /api/custom-themes/:id ─────────────────────────────────────────────

describe("DELETE /api/custom-themes/:id", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/theme-id-1", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 and deletes for authed user", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/theme-id-1", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── PATCH /api/custom-themes/:id ──────────────────────────────────────────────

describe("PATCH /api/custom-themes/:id", () => {
  it("returns 401 without auth", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/theme-id-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is on free plan", async () => {
    authed.mockResolvedValue("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ plan: "free" }]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/theme-id-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when theme not found on PATCH", async () => {
    authed.mockResolvedValue("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ plan: "pro" }]) }),
      }),
    });
    // Update returns empty → not found
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve([]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/nonexistent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns updated theme on successful PATCH", async () => {
    authed.mockResolvedValue("user-123");
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve([{ plan: "pro" }]) }),
      }),
    });
    const updated = { id: "t1", name: "My Theme", isPublic: true };
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve([updated]) }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/custom-themes/t1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPublic).toBe(true);
  });
});
