import { EVENT_TYPES, getVocabulary } from "@/types/event";
import { CURTAIN_STYLES, DEMO_WEDDING_CONFIG } from "@/types/wedding";
import { describe, expect, it } from "vitest";

describe("DEMO_WEDDING_CONFIG", () => {
  it("has required fields", () => {
    expect(DEMO_WEDDING_CONFIG.bride).toBeTruthy();
    expect(DEMO_WEDDING_CONFIG.groom).toBeTruthy();
    expect(DEMO_WEDDING_CONFIG.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has valid curtain style", () => {
    expect(CURTAIN_STYLES).toContain(DEMO_WEDDING_CONFIG.curtainStyle);
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

describe("Event vocabulary", () => {
  it.each(EVENT_TYPES)('vocabulary for "%s" has required fields', (type) => {
    const vocab = getVocabulary(type);
    expect(vocab.eventLabel).toBeTruthy();
    expect(vocab.host1Label).toBeTruthy();
    expect(vocab.finaleHeading).toBeTruthy();
    expect(vocab.emoji).toBeTruthy();
  });

  it("wedding vocabulary has dualHost = true", () => {
    expect(getVocabulary("wedding").dualHost).toBe(true);
  });

  it("birthday vocabulary has dualHost = false", () => {
    expect(getVocabulary("birthday").dualHost).toBe(false);
  });

  it("DEMO_WEDDING_CONFIG has eventType 'wedding'", () => {
    expect(DEMO_WEDDING_CONFIG.eventType).toBe("wedding");
  });
});
