import { describe, expect, it } from "vitest";

import { buildSections } from "@/lib/eventSections";
import type { EventConfig } from "@/types/event";

const baseConfig: EventConfig = {
  id: "evt-1",
  slug: "alice-bob",
  eventType: "wedding",
  bride: "Alice",
  groom: "Bob",
  date: "2026-06-01",
  venueDetails: [],
  themeKey: "royal",
  curtainStyle: "velvet",
  timeline: [],
  menuCourses: [],
  rsvpEnabled: true,
  published: true,
  passwordProtected: false,
};

function hasRegistrySection(config: EventConfig, registryItemCount?: number) {
  const sections = buildSections(
    config,
    true,
    () => {},
    registryItemCount,
    "scroll",
  );
  return sections.some((s) => s.key === "registry");
}

describe("buildSections — registry gating", () => {
  it("hides registry when both registryEnabled and cashGiftEnabled are off", () => {
    expect(hasRegistrySection({ ...baseConfig }, 0)).toBe(false);
  });

  it("hides registry when registryEnabled is on but there are zero items", () => {
    expect(
      hasRegistrySection({ ...baseConfig, registryEnabled: true }, 0),
    ).toBe(false);
  });

  it("shows registry when registryEnabled is on and items exist", () => {
    expect(
      hasRegistrySection({ ...baseConfig, registryEnabled: true }, 3),
    ).toBe(true);
  });

  it("shows registry when registryItemCount hasn't loaded yet (undefined)", () => {
    expect(
      hasRegistrySection({ ...baseConfig, registryEnabled: true }, undefined),
    ).toBe(true);
  });

  it("shows registry when cashGiftEnabled is on, even with zero physical items", () => {
    expect(
      hasRegistrySection(
        {
          ...baseConfig,
          registryEnabled: false,
          cashGiftEnabled: true,
          cashGift: { methods: [{ id: "1", type: "venmo", value: "@abc" }] },
        },
        0,
      ),
    ).toBe(true);
  });

  it("shows registry when both cash gifts and physical items are enabled", () => {
    expect(
      hasRegistrySection(
        {
          ...baseConfig,
          registryEnabled: true,
          cashGiftEnabled: true,
          cashGift: { methods: [{ id: "1", type: "venmo", value: "@abc" }] },
        },
        5,
      ),
    ).toBe(true);
  });
});
