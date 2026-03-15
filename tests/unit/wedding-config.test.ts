import { DEMO_WEDDING_CONFIG } from "@/types/wedding";
import { describe, expect, it } from "vitest";

describe("DEMO_WEDDING_CONFIG", () => {
  it("has required fields", () => {
    expect(DEMO_WEDDING_CONFIG.bride).toBeTruthy();
    expect(DEMO_WEDDING_CONFIG.groom).toBeTruthy();
    expect(DEMO_WEDDING_CONFIG.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has valid curtain style", () => {
    expect(["velvet", "drape"]).toContain(DEMO_WEDDING_CONFIG.curtainStyle);
  });

  it("has a valid theme key", () => {
    expect(DEMO_WEDDING_CONFIG.themeKey).toBeTruthy();
  });

  it("timeline is an array", () => {
    expect(Array.isArray(DEMO_WEDDING_CONFIG.timeline)).toBe(true);
  });

  it("menuCourses is an array", () => {
    expect(Array.isArray(DEMO_WEDDING_CONFIG.menuCourses)).toBe(true);
  });
});
