import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), transaction: vi.fn() },
}));

import { db } from "@/db";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.transaction.mockImplementation((fn: (tx: typeof mockDb) => unknown) =>
    fn(mockDb),
  );
});

describe("consumeRateLimit", () => {
  it("allows the first request for a new key (no existing row)", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({ where: () => ({ for: () => ({ limit: () => Promise.resolve([]) }) }) }),
    });
    const insertSpy = vi.fn().mockReturnValue({ values: () => Promise.resolve() });
    mockDb.insert.mockImplementation(insertSpy);

    const result = await consumeRateLimit("test-key", 5, 600);
    expect(result.allowed).toBe(true);
    expect(insertSpy).toHaveBeenCalledOnce();
  });

  it("allows and increments when under the limit", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          for: () => ({
            limit: () =>
              Promise.resolve([{ key: "test-key", count: 2, windowStart: new Date() }]),
          }),
        }),
      }),
    });
    const updateSpy = vi.fn().mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    });
    mockDb.update.mockImplementation(updateSpy);

    const result = await consumeRateLimit("test-key", 5, 600);
    expect(result.allowed).toBe(true);
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it("blocks once the count reaches the limit within the window", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          for: () => ({
            limit: () =>
              Promise.resolve([{ key: "test-key", count: 5, windowStart: new Date() }]),
          }),
        }),
      }),
    });

    const result = await consumeRateLimit("test-key", 5, 600);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("resets the window once it has expired, even if the old count was at the limit", async () => {
    const staleWindowStart = new Date(Date.now() - 700_000); // > 600s ago
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () => ({
          for: () => ({
            limit: () =>
              Promise.resolve([
                { key: "test-key", count: 5, windowStart: staleWindowStart },
              ]),
          }),
        }),
      }),
    });
    const updateSpy = vi.fn().mockReturnValue({
      set: (vals: { count: number }) => {
        expect(vals.count).toBe(1); // window reset, not incremented from 5
        return { where: () => Promise.resolve() };
      },
    });
    mockDb.update.mockImplementation(updateSpy);

    const result = await consumeRateLimit("test-key", 5, 600);
    expect(result.allowed).toBe(true);
  });

  it("locks the counter row with SELECT ... FOR UPDATE to serialize concurrent requests", async () => {
    const forSpy = vi.fn().mockReturnValue({ limit: () => Promise.resolve([]) });
    mockDb.select.mockReturnValue({ from: () => ({ where: () => ({ for: forSpy }) }) });
    mockDb.insert.mockReturnValue({ values: () => Promise.resolve() });

    await consumeRateLimit("test-key", 5, 600);
    expect(forSpy).toHaveBeenCalledWith("update");
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for, taking the first hop", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});
