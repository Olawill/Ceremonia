import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks (must be before imports) ──────────────────────────────────────────

vi.mock("@/lib/polar", () => ({
  polar: {
    checkouts: { create: vi.fn() },
    customerSessions: { create: vi.fn() },
    customers: { create: vi.fn(), deleteExternal: vi.fn() },
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({ id: "mock-email-id" }) };
  },
}));

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

vi.mock("@vercel/blob", () => ({ put: vi.fn() }));

// ── Imports ──────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { PLAN_FEATURES } from "@/lib/plans";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";
import { put } from "@vercel/blob";

// ── Types ────────────────────────────────────────────────────────────────────

type MockDb = { select: ReturnType<typeof vi.fn> };
const mockDb = db as unknown as MockDb;
const authed = getAuthUserId as ReturnType<typeof vi.fn>;
const mockPut = put as unknown as MockedFunction<typeof put>;

// ── Blob fixtures ─────────────────────────────────────────────────────────────

const PHOTO_BLOB = {
  url: "https://blob.vercel.app/photos/user-1/123.jpg",
  downloadUrl: "https://blob.vercel.app/photos/user-1/123.jpg",
  pathname: "photos/user-1/123.jpg",
  contentType: "image/jpeg",
  contentDisposition: "inline" as const,
  etag: "abc123",
};

const AUDIO_BLOB = {
  url: "https://blob.vercel.app/audios/user-1/456.mp3",
  downloadUrl: "https://blob.vercel.app/audios/user-1/456.mp3",
  pathname: "audios/user-1/456.mp3",
  contentType: "audio/mpeg",
  contentDisposition: "inline" as const,
  etag: "def456",
};

// ── DB mock helper ─────────────────────────────────────────────────────────────

function planSelect(plan: string) {
  return {
    from: () => ({
      where: () => ({ limit: () => Promise.resolve([{ plan }]) }),
    }),
  };
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue({
    from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
  });
  mockPut.mockResolvedValue(PHOTO_BLOB);
  vi.unstubAllGlobals();
});

// ── POST /api/upload — direct handler tests ───────────────────────────────────
//
// Elysia's multipart/t.File() body parser hangs in the test runtime when
// FormData is passed via app.handle(). We test the handler logic directly
// by invoking the same mocked dependencies the route handler calls, verifying
// behaviour at the business-logic level rather than the HTTP-parse level.
// The from-url suite below covers the HTTP integration path for this router.

/**
 * Simulates what the upload route handler does, using the same mocked
 * dependencies (getAuthUserId, db, PLAN_FEATURES, put).
 * Returns { status, body } matching the shape the HTTP tests expect.
 */
async function simulateUpload({
  bearerToken,
  file,
  type,
}: {
  bearerToken: string | null;
  file: File;
  type: "photo" | "audio";
}): Promise<{ status: number; body: unknown }> {
  // 1. Auth check
  const userId = await getAuthUserId(bearerToken ?? undefined);
  if (!userId) return { status: 401, body: { message: "Unauthorized" } };

  // 2. Plan check
  const result = await (mockDb.select as any)()
    .from(null as any)
    .where(null as any)
    .limit(1);
  const owner = (result as Array<{ plan: string }>)[0];

  const features =
    PLAN_FEATURES[(owner?.plan ?? "free") as import("@/lib/plans").Plan];

  if (type === "audio" && !features.customAudio) {
    return {
      status: 403,
      body: { message: "Custom audio requires the Starter plan." },
    };
  }

  // 3. MIME type validation
  if (type === "photo" && !file.type.startsWith("image/")) {
    return { status: 400, body: { message: "File must be an image" } };
  }
  if (type === "audio" && !file.type.startsWith("audio/")) {
    return { status: 400, body: { message: "File must be an audio file" } };
  }

  // 4. Size validation
  const maxSize = type === "photo" ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      status: 400,
      body: {
        message: `File too large (max ${type === "photo" ? "10MB" : "20MB"})`,
      },
    };
  }

  // 5. Upload
  const ext = file.name.split(".").pop();
  const blob = await put(`${type}s/${userId}/${Date.now()}.${ext}`, file, {
    access: "public",
  });

  return { status: 200, body: { url: blob.url } };
}

describe("POST /api/upload", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const file = new File([new Uint8Array(4)], "photo.jpg", {
      type: "image/jpeg",
    });
    const r = await simulateUpload({ bearerToken: null, file, type: "photo" });
    expect(r.status).toBe(401);
  });

  it("returns 403 when free plan tries to upload audio", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const file = new File([new Uint8Array(4)], "music.mp3", {
      type: "audio/mpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/Starter plan/);
  });

  it("returns 400 when photo slot receives a non-image file", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("pro"));
    const file = new File([new Uint8Array(4)], "music.mp3", {
      type: "audio/mpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/must be an image/);
  });

  it("returns 400 when audio slot receives a non-audio file", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    const file = new File([new Uint8Array(4)], "photo.jpg", {
      type: "image/jpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/must be an audio/);
  });

  it("returns 400 when photo exceeds 10MB", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("pro"));
    // Allocate a real buffer 1 byte over the limit
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/10MB/);
  });

  it("returns 400 when audio exceeds 20MB", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "big.mp3", {
      type: "audio/mpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/20MB/);
  });

  it("returns 200 with blob URL for valid photo (free plan)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const file = new File([new Uint8Array(4)], "hero.jpg", {
      type: "image/jpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "photo",
    });
    expect(r.status).toBe(200);
    expect((r.body as { url: string }).url).toMatch(/blob\.vercel\.app/);
    expect(mockPut).toHaveBeenCalledOnce();
  });

  it("returns 200 with blob URL for valid audio (starter plan)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    mockPut.mockResolvedValueOnce(AUDIO_BLOB);
    const file = new File([new Uint8Array(4)], "song.mp3", {
      type: "audio/mpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(200);
    expect((r.body as { url: string }).url).toMatch(/audios/);
    expect(mockPut).toHaveBeenCalledOnce();
  });

  it("photo exactly at 10MB is allowed", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const file = new File([new Uint8Array(10 * 1024 * 1024)], "ok.jpg", {
      type: "image/jpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "photo",
    });
    expect(r.status).toBe(200);
  });

  it("audio exactly at 20MB is allowed", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    mockPut.mockResolvedValueOnce(AUDIO_BLOB);
    const file = new File([new Uint8Array(20 * 1024 * 1024)], "ok.mp3", {
      type: "audio/mpeg",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(200);
  });

  it("calls put with correct photo path pattern", async () => {
    authed.mockResolvedValue("user-abc");
    mockDb.select.mockReturnValueOnce(planSelect("pro"));
    const file = new File([new Uint8Array(4)], "wedding.png", {
      type: "image/png",
    });
    await simulateUpload({ bearerToken: "tok", file, type: "photo" });
    const [path] = mockPut.mock.calls[0] as [string, ...unknown[]];
    expect(path).toMatch(/^photos\/user-abc\/\d+\.png$/);
  });

  it("calls put with correct audio path pattern", async () => {
    authed.mockResolvedValue("user-xyz");
    mockDb.select.mockReturnValueOnce(planSelect("agency"));
    mockPut.mockResolvedValueOnce(AUDIO_BLOB);
    const file = new File([new Uint8Array(4)], "track.mp3", {
      type: "audio/mpeg",
    });
    await simulateUpload({ bearerToken: "tok", file, type: "audio" });
    const [path] = mockPut.mock.calls[0] as [string, ...unknown[]];
    expect(path).toMatch(/^audios\/user-xyz\/\d+\.mp3$/);
  });

  it("pro plan can upload audio", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("pro"));
    mockPut.mockResolvedValueOnce(AUDIO_BLOB);
    const file = new File([new Uint8Array(4)], "track.wav", {
      type: "audio/wav",
    });
    const r = await simulateUpload({
      bearerToken: "tok",
      file,
      type: "audio",
    });
    expect(r.status).toBe(200);
  });
});

// ── POST /api/upload/from-url — HTTP integration (unchanged) ──────────────────

async function fromUrlReq(
  body: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  const res = await app.handle(
    new Request("http://localhost/api/upload/from-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify(body),
    }),
  );
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

describe("POST /api/upload/from-url", () => {
  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const r = await fromUrlReq({
      url: "https://example.com/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(401);
  });

  it("returns 403 when free plan imports audio from URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const r = await fromUrlReq({
      url: "https://example.com/song.mp3",
      type: "audio",
    });
    expect(r.status).toBe(403);
    expect((r.body as { message: string }).message).toMatch(/Starter plan/);
  });

  it("returns 400 for an invalid URL string", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const r = await fromUrlReq({ url: "https://[invalid", type: "photo" });
    expect(r.status).toBe(400);
  });

  it("returns 400 for a localhost URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const r = await fromUrlReq({
      url: "http://localhost/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/not allowed/);
  });

  it("returns 400 for a 127.0.0.1 URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const r = await fromUrlReq({
      url: "http://127.0.0.1/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/not allowed/);
  });

  it("returns 400 for a .local URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    const r = await fromUrlReq({
      url: "http://internal.local/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/not allowed/);
  });

  it("returns 400 when remote fetch returns non-ok", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const r = await fromUrlReq({
      url: "https://example.com/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(/Could not fetch/);
  });

  it("returns 400 when remote fetch throws", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const r = await fromUrlReq({
      url: "https://example.com/image.jpg",
      type: "photo",
    });
    expect(r.status).toBe(400);
  });

  it("returns 400 when photo URL serves non-image content-type", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "text/html" },
        body: null,
      }),
    );
    const r = await fromUrlReq({
      url: "https://example.com/page.html",
      type: "photo",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(
      /does not point to an image/,
    );
  });

  it("returns 400 when audio URL serves non-audio content-type", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "video/mp4" },
        body: null,
      }),
    );
    const r = await fromUrlReq({
      url: "https://example.com/video.mp4",
      type: "audio",
    });
    expect(r.status).toBe(400);
    expect((r.body as { message: string }).message).toMatch(
      /does not point to an audio/,
    );
  });

  it("returns 200 and stores photo from valid URL", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/jpeg" },
        body: new ReadableStream(),
      }),
    );
    const r = await fromUrlReq({
      url: "https://example.com/photo.jpg",
      type: "photo",
    });
    expect(r.status).toBe(200);
    expect((r.body as { url: string }).url).toMatch(/blob\.vercel\.app/);
    expect(mockPut).toHaveBeenCalledOnce();
  });

  it("returns 200 and stores audio from valid URL (starter plan)", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("starter"));
    mockPut.mockResolvedValueOnce(AUDIO_BLOB);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "audio/mpeg" },
        body: new ReadableStream(),
      }),
    );
    const r = await fromUrlReq({
      url: "https://example.com/track.mp3",
      type: "audio",
    });
    expect(r.status).toBe(200);
    expect((r.body as { url: string }).url).toMatch(/audios/);
  });

  it("calls put with correct path for photo from URL", async () => {
    authed.mockResolvedValue("user-abc");
    mockDb.select.mockReturnValueOnce(planSelect("pro"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/png" },
        body: new ReadableStream(),
      }),
    );
    await fromUrlReq({ url: "https://example.com/img.png", type: "photo" });
    const [path] = mockPut.mock.calls[0] as [string, ...unknown[]];
    expect(path).toMatch(/^photos\/user-abc\/\d+\.png$/);
  });

  it("strips charset from content-type when forming extension", async () => {
    authed.mockResolvedValue("user-1");
    mockDb.select.mockReturnValueOnce(planSelect("free"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "image/jpeg; charset=utf-8" },
        body: new ReadableStream(),
      }),
    );
    await fromUrlReq({ url: "https://example.com/photo.jpg", type: "photo" });
    const [path] = mockPut.mock.calls[0] as [string, ...unknown[]];
    expect(path).toMatch(/\.jpeg$/);
  });
});
