import { constantTimeEqual } from "@/lib/constant-time";
import { describe, expect, it } from "vitest";

describe("constantTimeEqual", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(constantTimeEqual("short", "a-much-longer-string")).toBe(false);
  });

  it("returns false when one string is empty", () => {
    expect(constantTimeEqual("", "nonempty")).toBe(false);
  });

  it("returns true when both strings are empty", () => {
    expect(constantTimeEqual("", "")).toBe(true);
  });

  it("is case-sensitive", () => {
    expect(constantTimeEqual("Token", "token")).toBe(false);
  });
});
