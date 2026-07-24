import { createHash } from "crypto";

import { hashPassword, verifyPassword } from "@/lib/password";
import { describe, expect, it } from "vitest";

describe("Password utilities", () => {
  it("hashes a password and verifies it correctly", () => {
    const hash = hashPassword("mysecret");
    expect(hash).not.toBe("mysecret");
    expect(verifyPassword("mysecret", hash)).toBe(true);
  });

  it("rejects wrong password", () => {
    const hash = hashPassword("correct");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("hashPassword", () => {
  it("returns a salted scrypt hash, not a bare digest", () => {
    const hash = hashPassword("mysecret");
    expect(hash).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
  });

  it("is NOT deterministic — same input produces a different hash each time (random salt)", () => {
    expect(hashPassword("hello")).not.toBe(hashPassword("hello"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashPassword("password1")).not.toBe(hashPassword("password2"));
  });

  it("handles empty string without throwing", () => {
    expect(() => hashPassword("")).not.toThrow();
  });

  it("is case-sensitive", () => {
    expect(hashPassword("Secret")).not.toBe(hashPassword("secret"));
  });

  it("handles unicode characters", () => {
    const hash = hashPassword("pässwörð");
    expect(verifyPassword("pässwörð", hash)).toBe(true);
  });

  it("handles long strings without throwing", () => {
    const long = "a".repeat(10_000);
    expect(() => hashPassword(long)).not.toThrow();
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

  it("returns false when both plain and stored hash are empty", () => {
    expect(verifyPassword("", "")).toBe(false);
  });

  it("is case-sensitive on the plain text", () => {
    const hash = hashPassword("Secret");
    expect(verifyPassword("secret", hash)).toBe(false);
    expect(verifyPassword("Secret", hash)).toBe(true);
  });

  it("returns false for a malformed scrypt-prefixed hash", () => {
    expect(verifyPassword("anything", "scrypt:onlyonepart")).toBe(false);
  });

  // ── Legacy format backward-compatibility ────────────────────────────────
  // Passwords set before the scrypt upgrade are stored as a bare unsalted
  // SHA-256 hex digest (no "scrypt:" prefix) — verifyPassword must still
  // accept those until the host changes their password.
  describe("legacy unsalted-SHA-256 hashes", () => {
    const legacyHash = (plain: string) =>
      createHash("sha256").update(plain).digest("hex");

    it("verifies a correct password against a legacy hash", () => {
      const hash = legacyHash("old-style-password");
      expect(verifyPassword("old-style-password", hash)).toBe(true);
    });

    it("rejects an incorrect password against a legacy hash", () => {
      const hash = legacyHash("old-style-password");
      expect(verifyPassword("wrong", hash)).toBe(false);
    });
  });
});
