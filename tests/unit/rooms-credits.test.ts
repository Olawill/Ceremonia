import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from "@/db";
import {
  consumeRoomCredit,
  getRoomCreditBalance,
} from "@/lib/rooms-credits";

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function selectReturns(rows: unknown[]) {
  mockDb.select.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(rows) }),
    }),
  });
}

const DAY_MS = 1000 * 60 * 60 * 24;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRoomCreditBalance", () => {
  it("free plan with no row has zero credits", async () => {
    selectReturns([]);
    const balance = await getRoomCreditBalance("user-1", "free");
    expect(balance.free.total).toBe(0);
    expect(balance.totalRemaining).toBe(0);
  });

  it("agency plan with no row gets the monthly free allowance", async () => {
    selectReturns([]);
    const balance = await getRoomCreditBalance("user-1", "agency");
    expect(balance.free.total).toBe(3);
    expect(balance.free.remaining).toBe(3);
    expect(balance.totalRemaining).toBe(3);
  });

  it("reflects partially used free + purchased credits within the period", async () => {
    selectReturns([
      {
        freeCreditsTotal: 3,
        freeCreditsUsed: 1,
        periodStart: new Date(),
        purchasedCreditsTotal: 5,
        purchasedCreditsUsed: 2,
      },
    ]);
    const balance = await getRoomCreditBalance("user-1", "agency");
    expect(balance.free.remaining).toBe(2);
    expect(balance.purchased.remaining).toBe(3);
    expect(balance.totalRemaining).toBe(5);
  });

  it("resets free credits once the period has expired", async () => {
    const staleStart = new Date(Date.now() - 40 * DAY_MS);
    selectReturns([
      {
        freeCreditsTotal: 3,
        freeCreditsUsed: 3,
        periodStart: staleStart,
        purchasedCreditsTotal: 0,
        purchasedCreditsUsed: 0,
      },
    ]);
    const balance = await getRoomCreditBalance("user-1", "agency");
    expect(balance.free.used).toBe(0);
    expect(balance.free.remaining).toBe(3);
    // periodStart should reflect "now", not the stale stored date
    expect(balance.periodStart.getTime()).toBeGreaterThan(staleStart.getTime());
  });

  it("free plan does not regain credits after period expiry", async () => {
    const staleStart = new Date(Date.now() - 40 * DAY_MS);
    selectReturns([
      {
        freeCreditsTotal: 0,
        freeCreditsUsed: 0,
        periodStart: staleStart,
        purchasedCreditsTotal: 2,
        purchasedCreditsUsed: 0,
      },
    ]);
    const balance = await getRoomCreditBalance("user-1", "free");
    expect(balance.free.total).toBe(0);
    expect(balance.purchased.remaining).toBe(2);
    expect(balance.totalRemaining).toBe(2);
  });
});

describe("consumeRoomCredit", () => {
  it("creates a row for a new agency user and consumes one free credit", async () => {
    selectReturns([]);
    mockDb.insert.mockReturnValue({
      values: () => ({
        returning: () =>
          Promise.resolve([
            {
              userId: "user-1",
              freeCreditsTotal: 3,
              freeCreditsUsed: 0,
              periodStart: new Date(),
              purchasedCreditsTotal: 0,
              purchasedCreditsUsed: 0,
            },
          ]),
      }),
    });
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: "row-1" }]),
        }),
      }),
    });

    const result = await consumeRoomCredit("user-1", "agency");
    expect(result.success).toBe(true);
    expect(result.freeRemaining).toBe(2);
    expect(result.totalRemaining).toBe(2);
  });

  it("throws NO_CREDITS when free plan has no purchased credits", async () => {
    selectReturns([
      {
        freeCreditsTotal: 0,
        freeCreditsUsed: 0,
        periodStart: new Date(),
        purchasedCreditsTotal: 0,
        purchasedCreditsUsed: 0,
      },
    ]);
    await expect(consumeRoomCredit("user-1", "free")).rejects.toThrow(
      "NO_CREDITS",
    );
  });

  it("falls back to purchased credits once free credits are exhausted", async () => {
    selectReturns([
      {
        freeCreditsTotal: 3,
        freeCreditsUsed: 3,
        periodStart: new Date(),
        purchasedCreditsTotal: 5,
        purchasedCreditsUsed: 1,
      },
    ]);
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: "row-1" }]),
        }),
      }),
    });

    const result = await consumeRoomCredit("user-1", "agency");
    expect(result.freeRemaining).toBe(0);
    expect(result.purchasedRemaining).toBe(3);
  });

  it("retries once when the optimistic-concurrency update loses the race", async () => {
    let selectCall = 0;
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () => {
            selectCall++;
            return Promise.resolve([
              {
                freeCreditsTotal: 3,
                freeCreditsUsed: 0,
                periodStart: new Date(),
                purchasedCreditsTotal: 0,
                purchasedCreditsUsed: 0,
              },
            ]);
          },
        }),
      }),
    }));

    let updateCall = 0;
    mockDb.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => {
            updateCall++;
            // First attempt loses the race (someone else updated first);
            // second attempt succeeds.
            return Promise.resolve(updateCall === 1 ? [] : [{ id: "row-1" }]);
          },
        }),
      }),
    });

    const result = await consumeRoomCredit("user-1", "agency");
    expect(result.success).toBe(true);
    expect(selectCall).toBe(2);
    expect(updateCall).toBe(2);
  });
});
