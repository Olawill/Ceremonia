import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({ id: "mock-email-id" }) };
  },
}));

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    UNSPLASH_ACCESS_KEY: "test-unsplash-key",
    PIXABAY_API_KEY: "test-pixabay-key",
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { app } from "@/server";

// ── Request helper ────────────────────────────────────────────────────────────

async function req(path: string): Promise<{ status: number; body: unknown }> {
  const res = await app.handle(
    new Request(`http://localhost/api/stock${path}`, { method: "GET" }),
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

// ── Unsplash / Pixabay mock responses ────────────────────────────────────────

const UNSPLASH_RESPONSE = {
  results: [
    {
      id: "abc123",
      urls: {
        small: "https://unsplash.com/thumb/abc.jpg",
        regular: "https://unsplash.com/full/abc.jpg",
      },
      alt_description: "Romantic arch",
      description: null,
      user: {
        name: "Alice Photo",
        links: { html: "https://unsplash.com/@alice" },
      },
    },
  ],
};

const PIXABAY_PHOTO_RESPONSE = {
  hits: [
    {
      id: 111,
      previewURL: "https://pixabay.com/thumb/111.jpg",
      webformatURL: "https://pixabay.com/full/111.jpg",
      tags: "wedding, flowers, arch",
    },
  ],
};

const PIXABAY_AUDIO_RESPONSE = {
  hits: [
    {
      id: 222,
      title: "Romantic Piano",
      duration: 180,
      audio: { "128": "https://pixabay.com/audio/222.mp3" },
    },
  ],
};

// ── beforeEach / afterEach ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── GET /api/stock/photos ─────────────────────────────────────────────────────

describe("GET /api/stock/photos", () => {
  it("returns 200 with combined photos from Unsplash and Pixabay", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(UNSPLASH_RESPONSE),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(PIXABAY_PHOTO_RESPONSE),
        }),
    );
    const r = await req("/photos?q=wedding+arch");
    expect(r.status).toBe(200);
    const body = r.body as { photos: unknown[]; page: number };
    expect(body.photos).toHaveLength(2); // 1 from each source
    expect(body.page).toBe(1);
  });

  it("returns only Pixabay results when Unsplash fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(PIXABAY_PHOTO_RESPONSE),
        }),
    );
    const r = await req("/photos?q=flowers");
    expect(r.status).toBe(200);
    const body = r.body as { photos: unknown[] };
    expect(body.photos).toHaveLength(1);
    const photo = body.photos[0] as { source: string };
    expect(photo.source).toBe("pixabay");
  });

  it("returns only Unsplash results when Pixabay fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(UNSPLASH_RESPONSE),
        })
        .mockResolvedValueOnce({ ok: false }),
    );
    const r = await req("/photos?q=arch");
    expect(r.status).toBe(200);
    const body = r.body as { photos: unknown[] };
    expect(body.photos).toHaveLength(1);
    const photo = body.photos[0] as { source: string };
    expect(photo.source).toBe("unsplash");
  });

  it("returns empty array when both APIs fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false }),
    );
    const r = await req("/photos?q=arch");
    expect(r.status).toBe(200);
    const body = r.body as { photos: unknown[] };
    expect(body.photos).toHaveLength(0);
  });

  it("defaults to page 1 when no page param given", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hits: [] }),
        }),
    );
    const r = await req("/photos");
    const body = r.body as { page: number };
    expect(body.page).toBe(1);
  });

  it("respects page param", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hits: [] }),
        }),
    );
    const r = await req("/photos?q=wedding&page=3");
    const body = r.body as { page: number };
    expect(body.page).toBe(3);
  });

  it("includes correct shape for unsplash photo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(UNSPLASH_RESPONSE),
        })
        .mockResolvedValueOnce({ ok: false }),
    );
    const r = await req("/photos?q=wedding");
    const photos = (r.body as { photos: unknown[] }).photos;
    const photo = photos[0] as {
      id: string;
      thumb: string;
      full: string;
      label: string;
      source: string;
      authorName: string;
      authorUrl: string;
    };
    expect(photo.id).toBe("unsplash-abc123");
    expect(photo.source).toBe("unsplash");
    expect(photo.thumb).toContain("unsplash.com");
    expect(photo.authorName).toBe("Alice Photo");
    expect(photo.authorUrl).toContain("unsplash.com");
  });

  it("includes correct shape for pixabay photo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(PIXABAY_PHOTO_RESPONSE),
        }),
    );
    const r = await req("/photos?q=wedding");
    const photos = (r.body as { photos: unknown[] }).photos;
    const photo = photos[0] as { id: string; source: string; label: string };
    expect(photo.id).toBe("pixabay-111");
    expect(photo.source).toBe("pixabay");
    expect(photo.label).toBe("wedding"); // first tag
  });

  it("handles both APIs throwing (Promise.allSettled catches)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network down")),
    );
    const r = await req("/photos?q=wedding");
    expect(r.status).toBe(200);
    const body = r.body as { photos: unknown[] };
    expect(body.photos).toHaveLength(0);
  });
});

// ── GET /api/stock/audio ──────────────────────────────────────────────────────

describe("GET /api/stock/audio", () => {
  it("returns 200 with audio tracks from Pixabay", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(PIXABAY_AUDIO_RESPONSE),
      }),
    );
    const r = await req("/audio?q=romantic+piano");
    expect(r.status).toBe(200);
    const body = r.body as { audio: unknown[]; page: number };
    expect(body.audio).toHaveLength(1);
    expect(body.page).toBe(1);
  });

  it("returns empty array when Pixabay audio fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));
    const r = await req("/audio?q=piano");
    expect(r.status).toBe(200);
    const body = r.body as { audio: unknown[] };
    expect(body.audio).toHaveLength(0);
  });

  it("returns correct shape for audio track", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(PIXABAY_AUDIO_RESPONSE),
      }),
    );
    const r = await req("/audio");
    const tracks = (r.body as { audio: unknown[] }).audio;
    const track = tracks[0] as {
      id: string;
      label: string;
      preview: string;
      full: string;
      source: string;
      duration: number;
    };
    expect(track.id).toBe("pixabay-audio-222");
    expect(track.source).toBe("pixabay");
    expect(track.label).toBe("Romantic Piano");
    expect(track.duration).toBe(180);
    expect(track.preview).toContain("pixabay.com");
  });

  it("defaults to page 1 when no page param given", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hits: [] }),
      }),
    );
    const r = await req("/audio");
    const body = r.body as { page: number };
    expect(body.page).toBe(1);
  });

  it("respects page param", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hits: [] }),
      }),
    );
    const r = await req("/audio?q=jazz&page=2");
    const body = r.body as { page: number };
    expect(body.page).toBe(2);
  });

  it("handles Pixabay throwing an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));
    const r = await req("/audio");
    // Router catches the rejection and returns empty or error — either is valid
    expect([200, 500].includes(r.status)).toBe(true);
  });
});
