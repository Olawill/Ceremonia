import {
  createCountDownLoaction,
  formattedDate,
  formattedDeadlineDate,
} from "@/lib/helper";
import { describe, expect, it } from "vitest";

describe("formattedDate", () => {
  it("formats without dots by default", () => {
    const result = formattedDate("2026-07-12");
    expect(result).toBe("12 July 2026");
  });

  it("formats with dots when dotted=true", () => {
    const result = formattedDate("2026-07-12", true);
    expect(result).toBe("12 • July • 2026");
  });

  it("accepts a Date object", () => {
    expect(formattedDate(new Date(2026, 6, 12))).toBe("12 July 2026");
  });

  it("accepts an explicit locale", () => {
    // US locale — "July 12, 2026"
    expect(formattedDate("2026-07-12", false, "en-US")).toBe("July 12, 2026");
  });

  it("dotted with explicit locale", () => {
    expect(formattedDate("2026-07-12", true, "en-US")).toBe("July • 12 • 2026");
  });
});

describe("formattedDeadlineDate", () => {
  it("formats an ISO date string to long form", () => {
    const result = formattedDeadlineDate("2026-07-12");
    expect(result).toBe("July 12th, 2026");
  });
});

describe("createCountDownLoaction", () => {
  it("returns venue value and first part of sub", () => {
    const result = createCountDownLoaction({
      label: "Ceremony",
      value: "St Paul's Cathedral",
      sub: "London, EC4M 8AD",
    });
    expect(result).toBe("St Paul's Cathedral, London");
  });

  it("handles sub with no comma", () => {
    const result = createCountDownLoaction({
      label: "Ceremony",
      value: "The Barn",
      sub: "Countryside",
    });
    expect(result).toBe("The Barn, Countryside");
  });
});
