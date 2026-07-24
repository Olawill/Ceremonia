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

vi.mock("@/server/auth", () => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/rooms-credits", () => ({
  consumeRoomCredit: vi.fn(),
  getRoomCreditBalance: vi.fn(),
}));

import { db } from "@/db";
import { consumeRoomCredit, getRoomCreditBalance } from "@/lib/rooms-credits";
import { app } from "@/server";
import { getAuthUserId } from "@/server/auth";

const authed = getAuthUserId as ReturnType<typeof vi.fn>;
const mockConsume = consumeRoomCredit as ReturnType<typeof vi.fn>;
const mockBalance = getRoomCreditBalance as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const DEFAULT_BALANCE = {
  free: { total: 3, used: 0, remaining: 3 },
  purchased: { total: 0, used: 0, remaining: 0 },
  totalRemaining: 3,
};

/** Wires db.select() to answer, in call order: owner plan lookup, then the
 * event-existence lookup (navMode). Matches PATCH /api/events/:slug's query
 * sequence exactly. */
function mockSelectSequence(ownerRow: unknown[], eventRow: unknown[]) {
  let call = 0;
  mockDb.select.mockImplementation(() => ({
    from: () => ({
      where: () => ({
        limit: () => {
          call++;
          return Promise.resolve(call === 1 ? ownerRow : eventRow);
        },
      }),
    }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBalance.mockResolvedValue(DEFAULT_BALANCE);
  mockDb.update.mockReturnValue({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([{ slug: "alice-bob", navMode: "rooms" }]),
      }),
    }),
  });
});

describe("PATCH /api/events/:slug — rooms credit gating", () => {
  it("404s on a nonexistent event WITHOUT consuming a rooms credit", async () => {
    authed.mockResolvedValue("user-123");
    mockSelectSequence([{ plan: "agency" }], []); // owner exists, event does not

    const res = await app.handle(
      new Request("http://localhost/api/events/nonexistent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navMode: "rooms" }),
      }),
    );

    expect(res.status).toBe(404);
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("consumes a credit when navMode transitions from scroll to rooms", async () => {
    authed.mockResolvedValue("user-123");
    mockSelectSequence(
      [{ plan: "agency" }],
      [{ navMode: "scroll" }], // existing event was in scroll mode
    );
    mockConsume.mockResolvedValue({
      success: true,
      freeRemaining: 2,
      purchasedRemaining: 0,
      totalRemaining: 2,
    });

    const res = await app.handle(
      new Request("http://localhost/api/events/alice-bob", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navMode: "rooms" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockConsume).toHaveBeenCalledTimes(1);
    expect(mockConsume).toHaveBeenCalledWith("user-123", "agency");
  });

  it("does NOT consume a credit when already in rooms mode (no transition)", async () => {
    authed.mockResolvedValue("user-123");
    mockSelectSequence(
      [{ plan: "agency" }],
      [{ navMode: "rooms" }], // already rooms — re-saving shouldn't re-charge
    );

    const res = await app.handle(
      new Request("http://localhost/api/events/alice-bob", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navMode: "rooms" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("does not touch credits at all when navMode is not being set to rooms", async () => {
    authed.mockResolvedValue("user-123");
    mockSelectSequence([{ plan: "free" }], [{ navMode: "scroll" }]);

    const res = await app.handle(
      new Request("http://localhost/api/events/alice-bob", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bride: "Alice" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("returns 403 with a clear message when credits are exhausted", async () => {
    authed.mockResolvedValue("user-123");
    mockSelectSequence([{ plan: "free" }], [{ navMode: "scroll" }]);
    mockConsume.mockRejectedValue(new Error("NO_CREDITS"));

    const res = await app.handle(
      new Request("http://localhost/api/events/alice-bob", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navMode: "rooms" }),
      }),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/credits/i);
  });
});
