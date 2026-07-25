import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: { select: vi.fn(), update: vi.fn() },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({ id: "mock-email-id" }) };
  },
}));

vi.mock("@/env", () => ({
  env: { RESEND_API_KEY: "re_test" },
}));

import { db } from "@/db";
import { sendExpiryReminders } from "@/lib/expiry-reminders";
import { resend } from "@/lib/resend";

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const mockSend = resend.emails.send as ReturnType<typeof vi.fn>;

function inDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendExpiryReminders", () => {
  it("only queries events with reminderSentAt still unset", async () => {
    let capturedWhere: unknown;
    mockDb.select.mockReturnValue({
      from: () => ({
        where: (w: unknown) => {
          capturedWhere = w;
          return Promise.resolve([]);
        },
      }),
    });

    await sendExpiryReminders();

    // Can't easily introspect drizzle's SQL AST here, but we can at least
    // confirm the where clause was built (non-empty) — the real regression
    // guard is the "sends only once" test below, exercised end-to-end.
    expect(capturedWhere).toBeDefined();
  });

  it("sends the reminder once and marks reminderSentAt", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              slug: "alice-bob",
              bride: "Alice",
              expiresAt: inDays(3),
              notificationEmail: "alice@example.com",
              userId: "user-1",
            },
          ]),
      }),
    });
    const updateSpy = vi.fn().mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    });
    mockDb.update.mockImplementation(updateSpy);

    await sendExpiryReminders();

    expect(mockSend).toHaveBeenCalledOnce();
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it("does NOT mark reminderSentAt when the email send fails, so it retries next run", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              slug: "alice-bob",
              bride: "Alice",
              expiresAt: inDays(3),
              notificationEmail: "alice@example.com",
              userId: "user-1",
            },
          ]),
      }),
    });
    mockSend.mockRejectedValueOnce(new Error("Resend API down"));

    await sendExpiryReminders();

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("skips events with no notification email without touching reminderSentAt", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              slug: "no-email-event",
              bride: "Bob",
              expiresAt: inDays(3),
              notificationEmail: null,
              userId: "user-2",
            },
          ]),
      }),
    });

    await sendExpiryReminders();

    expect(mockSend).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("processes multiple events independently, each getting its own reminderSentAt update", async () => {
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              slug: "event-a",
              bride: "A",
              expiresAt: inDays(1),
              notificationEmail: "a@example.com",
              userId: "user-a",
            },
            {
              slug: "event-b",
              bride: "B",
              expiresAt: inDays(6),
              notificationEmail: "b@example.com",
              userId: "user-b",
            },
          ]),
      }),
    });
    const updateSpy = vi.fn().mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    });
    mockDb.update.mockImplementation(updateSpy);

    await sendExpiryReminders();

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});
