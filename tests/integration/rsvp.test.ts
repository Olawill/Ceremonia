import { describe, expect, it, vi } from "vitest";

// All mocks must come before any imports that trigger module evaluation
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    };
  },
}));

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/server/auth", () => ({
  getAuthUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

import { app } from "@/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getAuthUserId } from "@/server/auth";

const authed = getAuthUserId as ReturnType<typeof vi.fn>;

describe("POST /api/rsvp — unauthenticated access", () => {
  it("returns 429 when the caller has hit the rate limit", async () => {
    const mockConsumeRateLimit = consumeRateLimit as ReturnType<typeof vi.fn>;
    mockConsumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 300,
    });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Jane Doe",
          attendance: "yes",
        }),
      }),
    );

    expect(res.status).toBe(429);
    mockConsumeRateLimit.mockResolvedValue({ allowed: true }); // restore default
  });

  it("returns 404 when body is missing eventId that matches nothing", async () => {
    const { db } = await import("@/db");

    // Simulate no event found
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "00000000-0000-0000-0000-000000000000",
          name: "Jane Doe",
          attendance: "yes",
          guests: 2,
        }),
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Event not found");
  });

  it("returns 422 when required fields are missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: 1 }), // missing eventId, name, attendance
      }),
    );
    // Elysia returns 422 for schema validation failures
    expect(res.status).toBe(422);
  });

  it("returns 422 when name exceeds the max length", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "a".repeat(201),
          attendance: "yes",
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 when dietary notes exceed the max length", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Jane Doe",
          attendance: "yes",
          dietary: "a".repeat(501),
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 when message exceeds the max length", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Jane Doe",
          attendance: "yes",
          message: "a".repeat(2001),
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 when guests count is out of range", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Jane Doe",
          attendance: "yes",
          guests: 500,
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 403 when free plan RSVP cap (20) is reached", async () => {
    const { db } = await import("@/db");
    const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;

    // First call: get event — returns event with userId
    // Second call: get owner plan — returns free
    // Third call: get rsvp count — returns 20 (at cap)
    mockSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: "wedding-123",
                  rsvpEnabled: true,
                  notificationEmail: null,
                  bride: "Alice",
                  groom: "Bob",
                  userId: "user-123",
                },
              ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ plan: "free" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => Promise.resolve([{ total: 20 }]),
        }),
      });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Guest 21",
          attendance: "yes",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 when RSVPs are closed", async () => {
    const { db } = await import("@/db");
    const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: "wedding-123",
                rsvpEnabled: false,
                notificationEmail: null,
                bride: "Alice",
                groom: "Bob",
                userId: "user-123",
              },
            ]),
        }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Guest",
          attendance: "yes",
        }),
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("RSVPs are closed");
  });

  it("returns 200 and saves RSVP for unlimited plan (starter+)", async () => {
    const { db } = await import("@/db");
    const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;
    const mockInsert = (db as any).insert as ReturnType<typeof vi.fn>;

    mockSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: "wedding-123",
                  rsvpEnabled: true,
                  notificationEmail: null,
                  bride: "Alice",
                  groom: "Bob",
                  userId: "user-123",
                },
              ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ plan: "starter" }]),
          }),
        }),
      });

    mockInsert.mockReturnValueOnce({
      values: () => ({
        returning: () => Promise.resolve([{ id: "rsvp-1" }]),
      }),
    });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "wedding-123",
          name: "Happy Guest",
          attendance: "yes",
          guests: 2,
          dietary: "vegan",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("GET /api/rsvp", () => {
  it("returns 400 when eventId is missing", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", { method: "GET" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/rsvp?eventId=wedding-1", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when event not found", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/rsvp?eventId=wedding-1", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when requester does not own the event", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ userId: "someone-else" }]),
        }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/rsvp?eventId=wedding-1", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns results when the owner is authenticated", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    const mockRsvps = [
      {
        id: "rsvp-1",
        eventId: "wedding-1",
        name: "Alice",
        attendance: "yes",
        guests: 2,
      },
    ];

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ userId: "user-123" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(mockRsvps),
          }),
        }),
      });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp?eventId=wedding-1", {
        method: "GET",
        headers: { Authorization: "Bearer test-token" },
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("GET /api/rsvp/export", () => {
  it("returns 400 when eventId is missing", async () => {
    authed.mockResolvedValue("user-123");
    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export", { method: "GET" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    authed.mockResolvedValue(null);
    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export?eventId=wedding-123", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when requester does not own the event", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ userId: "someone-else" }]),
        }),
      }),
    });
    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export?eventId=wedding-123", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is on free plan", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;

    mockSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ userId: "user-123" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ plan: "free" }]),
          }),
        }),
      });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export?eventId=wedding-123", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns CSV when the owner is on pro plan", async () => {
    authed.mockResolvedValue("user-123");
    const { db } = await import("@/db");
    const mockSelect = (db as any).select as ReturnType<typeof vi.fn>;

    mockSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ userId: "user-123" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ plan: "pro" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: () =>
              Promise.resolve([
                {
                  id: "r1",
                  name: 'Alice "The Great"',
                  attendance: "yes",
                  guests: 2,
                  dietary: "vegan",
                  message: "Can't wait!",
                  createdAt: new Date("2026-01-01"),
                },
              ]),
          }),
        }),
      });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export?eventId=wedding-123", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const csv = await res.text();
    // Embedded quote must be escaped, not break the CSV structure
    expect(csv).toContain('"Alice ""The Great"""');
  });
});
