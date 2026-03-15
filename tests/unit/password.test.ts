import { hashPassword, verifyPassword } from "@/lib/password";
import { describe, expect, it } from "vitest";

describe("Password utilities", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("mysecret");
    expect(hash).not.toBe("mysecret");
    const valid = await verifyPassword("mysecret", hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct");
    const valid = await verifyPassword("wrong", hash);
    expect(valid).toBe(false);
  });
});

describe("hashPassword", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashPassword("mysecret");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic — same input always produces same hash", () => {
    expect(hashPassword("hello")).toBe(hashPassword("hello"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashPassword("password1")).not.toBe(hashPassword("password2"));
  });

  it("handles empty string without throwing", () => {
    const hash = hashPassword("");
    expect(hash).toHaveLength(64);
  });

  it("is case-sensitive", () => {
    expect(hashPassword("Secret")).not.toBe(hashPassword("secret"));
  });

  it("handles unicode characters", () => {
    const hash = hashPassword("pässwörð");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("handles long strings without throwing", () => {
    const long = "a".repeat(10_000);
    const hash = hashPassword(long);
    expect(hash).toHaveLength(64);
  });
});

describe("verifyPassword", () => {
  it("returns true when plain text matches the stored hash", () => {
    const hash = hashPassword("correct-horse-battery");
    expect(verifyPassword("correct-horse-battery", hash)).toBe(true);
  });

  it("returns false when plain text does not match", () => {
    const hash = hashPassword("correct");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("returns false for empty string against a real hash", () => {
    const hash = hashPassword("not-empty");
    expect(verifyPassword("", hash)).toBe(false);
  });

  it("returns false when hash is an empty string", () => {
    expect(verifyPassword("anything", "")).toBe(false);
  });

  it("returns false when both are empty (empty hash of empty string is valid but won't match '')", () => {
    // hashPassword("") produces a real SHA-256 — it won't equal ""
    expect(verifyPassword("", "")).toBe(false);
  });

  it("is case-sensitive on the plain text", () => {
    const hash = hashPassword("Secret");
    expect(verifyPassword("secret", hash)).toBe(false);
    expect(verifyPassword("Secret", hash)).toBe(true);
  });
});
