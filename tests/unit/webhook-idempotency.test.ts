import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: { insert: vi.fn() },
}));

import { db } from "@/db";
import { claimWebhookEvent } from "@/lib/webhook-idempotency";

const mockInsert = db.insert as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("claimWebhookEvent", () => {
  it("returns true (claimed) the first time an event id is seen", async () => {
    mockInsert.mockReturnValue({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve([{ id: "order-1" }]),
        }),
      }),
    });

    const claimed = await claimWebhookEvent("order-1", "order.created");
    expect(claimed).toBe(true);
  });

  it("returns false (duplicate) when the event id was already processed", async () => {
    mockInsert.mockReturnValue({
      values: () => ({
        onConflictDoNothing: () => ({
          // Conflict on the primary key — nothing inserted, empty array back
          returning: () => Promise.resolve([]),
        }),
      }),
    });

    const claimed = await claimWebhookEvent("order-1", "order.created");
    expect(claimed).toBe(false);
  });
});
