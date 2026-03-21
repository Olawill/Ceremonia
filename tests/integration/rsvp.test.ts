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

import { app } from "@/server";

describe("POST /api/rsvp — unauthenticated access", () => {
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
    const res = await app.handle(
      new Request("http://localhost/api/rsvp", { method: "GET" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns results when eventId is provided", async () => {
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

    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve(mockRsvps),
        }),
      }),
    });

    const res = await app.handle(
      new Request("http://localhost/api/rsvp?eventId=wedding-1", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("GET /api/rsvp/export", () => {
  it("returns 400 when eventId is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/rsvp/export", { method: "GET" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is on free plan", async () => {
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

  it("returns CSV when user is on pro plan", async () => {
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
                  name: "Alice",
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
  });
});
