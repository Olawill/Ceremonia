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
