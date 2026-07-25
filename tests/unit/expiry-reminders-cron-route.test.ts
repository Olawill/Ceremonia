import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/expiry-reminders", () => ({
  sendExpiryReminders: vi.fn().mockResolvedValue(undefined),
}));

let envMock: { CRON_SECRET: string | undefined };
vi.mock("@/env", () => ({
  get env() {
    return envMock;
  },
}));

import { NextRequest } from "next/server";

import { GET } from "@/app/api/cron/expiry-reminders/route";
import { sendExpiryReminders } from "@/lib/expiry-reminders";

const mockSendExpiryReminders = sendExpiryReminders as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  envMock = { CRON_SECRET: "test-secret" };
});

function req(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/expiry-reminders", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET /api/cron/expiry-reminders", () => {
  it("returns 500 when CRON_SECRET is not configured", async () => {
    envMock.CRON_SECRET = undefined;
    const res = await GET(req("Bearer anything"));
    expect(res.status).toBe(500);
    expect(mockSendExpiryReminders).not.toHaveBeenCalled();
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(mockSendExpiryReminders).not.toHaveBeenCalled();
  });

  it("returns 401 when the Authorization header doesn't match CRON_SECRET", async () => {
    const res = await GET(req("Bearer wrong-secret"));
    expect(res.status).toBe(401);
    expect(mockSendExpiryReminders).not.toHaveBeenCalled();
  });

  it("runs the reminder job and returns 200 when the secret matches", async () => {
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(mockSendExpiryReminders).toHaveBeenCalledOnce();
  });
});
