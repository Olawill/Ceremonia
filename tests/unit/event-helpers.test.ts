import { getHost1Name, getHost2Name, getHostsLabel } from "@/lib/eventHelpers";
import { DEMO_EVENT_CONFIG } from "@/types/event";
import { describe, expect, it } from "vitest";

describe("getHost1Name", () => {
  it("returns bride for wedding config", () => {
    expect(getHost1Name(DEMO_EVENT_CONFIG)).toBe(DEMO_EVENT_CONFIG.bride);
  });

  it("returns host1Name when set", () => {
    const config = { ...DEMO_EVENT_CONFIG, host1Name: "Sarah" };
    expect(getHost1Name(config)).toBe("Sarah");
  });
});

describe("getHost2Name", () => {
  it("returns groom for wedding config", () => {
    expect(getHost2Name(DEMO_EVENT_CONFIG)).toBe(DEMO_EVENT_CONFIG.groom);
  });

  it("returns undefined for single-host event (birthday)", () => {
    const config = { ...DEMO_EVENT_CONFIG, eventType: "birthday" as const };
    expect(getHost2Name(config)).toBeUndefined();
  });
});

describe("getHostsLabel", () => {
  it("returns 'Bride & Groom' format for wedding", () => {
    const label = getHostsLabel(DEMO_EVENT_CONFIG);
    expect(label).toContain("&");
  });

  it("returns just the host name for birthday", () => {
    const config = {
      ...DEMO_EVENT_CONFIG,
      eventType: "birthday" as const,
      bride: "Emma",
    };
    expect(getHostsLabel(config)).toBe("Emma");
    expect(getHostsLabel(config)).not.toContain("&");
  });
});
