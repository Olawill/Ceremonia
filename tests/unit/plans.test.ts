import {
  Plan,
  PLAN_FEATURES,
  PLAN_ORDER,
  planMeetsRequirement,
} from "@/lib/plans";
import { describe, expect, it } from "vitest";

describe("PLAN_ORDER", () => {
  it("has all four plans in ascending order", () => {
    expect(PLAN_ORDER).toEqual(["free", "starter", "pro", "agency"]);
  });

  it("is in ascending order of privilege", () => {
    const indexOf = (p: Plan) => PLAN_ORDER.indexOf(p);
    expect(indexOf("free")).toBeLessThan(indexOf("starter"));
    expect(indexOf("starter")).toBeLessThan(indexOf("pro"));
    expect(indexOf("pro")).toBeLessThan(indexOf("agency"));
  });
});

describe("PLAN_FEATURES", () => {
  it("free plan has rsvp limit", () => {
    expect(PLAN_FEATURES.free.unlimitedRsvps).toBe(false);
  });

  it("free plan has watermark", () => {
    expect(PLAN_FEATURES.free.watermark).toBe(true);
  });

  it("free plan has limited event count", () => {
    expect(PLAN_FEATURES.free.maxEvents).toBe(1);
  });

  it("starter removes watermark", () => {
    expect(PLAN_FEATURES.starter.watermark).toBe(false);
  });

  it("starter has unlimited rsvps", () => {
    expect(PLAN_FEATURES.starter.unlimitedRsvps).toBe(true);
  });

  it("pro allows custom domains", () => {
    expect(PLAN_FEATURES.pro.customDomain).toBe(true);
  });

  it("pro allows password protection", () => {
    expect(PLAN_FEATURES.pro.passwordProtection).toBe(true);
  });

  it("pro allows analytics", () => {
    expect(PLAN_FEATURES.pro.analytics).toBe(true);
  });

  it("agency has unlimited events", () => {
    expect(PLAN_FEATURES.agency.maxEvents).toBe(Infinity);
  });

  it("agency has white label", () => {
    expect(PLAN_FEATURES.agency.whitLabel).toBe(true);
  });

  it("agency has registry scraper", () => {
    expect(PLAN_FEATURES.agency.registryScraper).toBe(true);
  });

  it("agency has unlimited registry items", () => {
    expect(PLAN_FEATURES.agency.registryItemLimit).toBe(Infinity);
  });
});

describe("planMeetsRequirement", () => {
  it("free does not meet starter", () => {
    expect(planMeetsRequirement("free", "starter")).toBe(false);
  });

  it("free does not meet pro", () => {
    expect(planMeetsRequirement("free", "pro")).toBe(false);
  });

  it("free does not meet agency", () => {
    expect(planMeetsRequirement("free", "agency")).toBe(false);
  });

  it("free meets free", () => {
    expect(planMeetsRequirement("free", "free")).toBe(true);
  });

  it("starter meets free and starter", () => {
    expect(planMeetsRequirement("starter", "free")).toBe(true);
    expect(planMeetsRequirement("starter", "starter")).toBe(true);
  });

  it("starter does not meet pro or agency", () => {
    expect(planMeetsRequirement("starter", "pro")).toBe(false);
    expect(planMeetsRequirement("starter", "agency")).toBe(false);
  });

  it("pro meets free, starter, and pro", () => {
    expect(planMeetsRequirement("pro", "free")).toBe(true);
    expect(planMeetsRequirement("pro", "starter")).toBe(true);
    expect(planMeetsRequirement("pro", "pro")).toBe(true);
  });

  it("pro does not meet agency", () => {
    expect(planMeetsRequirement("pro", "agency")).toBe(false);
  });

  it("agency meets all plans", () => {
    expect(planMeetsRequirement("agency", "free")).toBe(true);
    expect(planMeetsRequirement("agency", "starter")).toBe(true);
    expect(planMeetsRequirement("agency", "pro")).toBe(true);
    expect(planMeetsRequirement("agency", "agency")).toBe(true);
  });
});

describe("PLAN_FEATURES — watermark", () => {
  it("free plan shows watermark", () => {
    expect(PLAN_FEATURES.free.watermark).toBe(true);
  });

  it("starter and above do NOT show watermark", () => {
    expect(PLAN_FEATURES.starter.watermark).toBe(false);
    expect(PLAN_FEATURES.pro.watermark).toBe(false);
    expect(PLAN_FEATURES.agency.watermark).toBe(false);
  });
});

// ── PLAN_FEATURES — event limits ────────────────────────────────────────────

describe("PLAN_FEATURES — maxEvents", () => {
  it("free is capped at 1", () => {
    expect(PLAN_FEATURES.free.maxEvents).toBe(1);
  });

  it("starter is capped at 1", () => {
    expect(PLAN_FEATURES.starter.maxEvents).toBe(1);
  });

  it("pro allows up to 5", () => {
    expect(PLAN_FEATURES.pro.maxEvents).toBe(5);
  });

  it("agency has unlimited events", () => {
    expect(PLAN_FEATURES.agency.maxEvents).toBe(Infinity);
  });
});

// ── PLAN_FEATURES — starter+ features ────────────────────────────────────────

describe("PLAN_FEATURES — starter+ features", () => {
  const starterAndAbove: Plan[] = ["starter", "pro", "agency"];
  const freeOnly: Plan[] = ["free"];

  it("only starter+ have customAudio", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].customAudio).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].customAudio).toBe(true);
  });

  it("only starter+ have allBuiltInThemes", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].allBuiltInThemes).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].allBuiltInThemes).toBe(true);
  });

  it("only starter+ have bothCurtainStyles", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].bothCurtainStyles).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].bothCurtainStyles).toBe(true);
  });

  it("only starter+ have unlimitedRsvps", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].unlimitedRsvps).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].unlimitedRsvps).toBe(true);
  });

  it("only starter+ have rsvpEmails", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].rsvpEmails).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].rsvpEmails).toBe(true);
  });

  it("only starter+ have registryScraper", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].registryScraper).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].registryScraper).toBe(true);
  });

  it("only starter+ have cashGifts", () => {
    for (const plan of freeOnly)
      expect(PLAN_FEATURES[plan].cashGifts).toBe(false);
    for (const plan of starterAndAbove)
      expect(PLAN_FEATURES[plan].cashGifts).toBe(true);
  });
});

// ── PLAN_FEATURES — pro+ features ────────────────────────────────────────────

describe("PLAN_FEATURES — pro+ features", () => {
  const belowPro: Plan[] = ["free", "starter"];
  const proAndAbove: Plan[] = ["pro", "agency"];

  it("only pro+ have customThemes", () => {
    for (const plan of belowPro)
      expect(PLAN_FEATURES[plan].customThemes).toBe(false);
    for (const plan of proAndAbove)
      expect(PLAN_FEATURES[plan].customThemes).toBe(true);
  });

  it("only pro+ have passwordProtection", () => {
    for (const plan of belowPro)
      expect(PLAN_FEATURES[plan].passwordProtection).toBe(false);
    for (const plan of proAndAbove)
      expect(PLAN_FEATURES[plan].passwordProtection).toBe(true);
  });

  it("only pro+ have analytics", () => {
    for (const plan of belowPro)
      expect(PLAN_FEATURES[plan].analytics).toBe(false);
    for (const plan of proAndAbove)
      expect(PLAN_FEATURES[plan].analytics).toBe(true);
  });

  it("only pro+ have csvExport", () => {
    for (const plan of belowPro)
      expect(PLAN_FEATURES[plan].csvExport).toBe(false);
    for (const plan of proAndAbove)
      expect(PLAN_FEATURES[plan].csvExport).toBe(true);
  });

  it("only pro+ have customDomain", () => {
    for (const plan of belowPro)
      expect(PLAN_FEATURES[plan].customDomain).toBe(false);
    for (const plan of proAndAbove)
      expect(PLAN_FEATURES[plan].customDomain).toBe(true);
  });

  it("pro+ have unlimited registry items", () => {
    for (const plan of proAndAbove) {
      expect(PLAN_FEATURES[plan].registryItemLimit).toBe(Infinity);
    }
  });

  it("free and starter have finite registry item limits", () => {
    expect(PLAN_FEATURES.free.registryItemLimit).toBe(10);
    expect(PLAN_FEATURES.starter.registryItemLimit).toBe(30);
  });
});

// ── PLAN_FEATURES — agency-only features ─────────────────────────────────────

describe("PLAN_FEATURES — agency-only features", () => {
  const belowAgency: Plan[] = ["free", "starter", "pro"];

  it("only agency has whitLabel", () => {
    for (const plan of belowAgency)
      expect(PLAN_FEATURES[plan].whitLabel).toBe(false);
    expect(PLAN_FEATURES.agency.whitLabel).toBe(true);
  });

  it("only agency has apiAccess", () => {
    for (const plan of belowAgency)
      expect(PLAN_FEATURES[plan].apiAccess).toBe(false);
    expect(PLAN_FEATURES.agency.apiAccess).toBe(true);
  });
});

describe("PLAN_FEATURES — envelopeEntry", () => {
  it("free and starter cannot use envelope entry", () => {
    expect(PLAN_FEATURES.free.envelopeEntry).toBe(false);
    expect(PLAN_FEATURES.starter.envelopeEntry).toBe(false);
  });
  it("pro and agency can use envelope entry", () => {
    expect(PLAN_FEATURES.pro.envelopeEntry).toBe(true);
    expect(PLAN_FEATURES.agency.envelopeEntry).toBe(true);
  });
});

describe("PLAN_FEATURES — roomsNavMode", () => {
  it("only agency has roomsNavMode included", () => {
    expect(PLAN_FEATURES.free.roomsNavMode).toBe(false);
    expect(PLAN_FEATURES.starter.roomsNavMode).toBe(false);
    expect(PLAN_FEATURES.pro.roomsNavMode).toBe(false);
    expect(PLAN_FEATURES.agency.roomsNavMode).toBe(true);
  });
});
