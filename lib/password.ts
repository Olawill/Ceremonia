import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

/** Hashes a plain-text event password with scrypt and a random per-password salt. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored hash. Also accepts the
 * legacy unsalted-SHA-256 format (no "scrypt:" prefix) so passwords set
 * before this upgrade keep working — they're verified via the old
 * algorithm, not re-hashed, since re-hashing happens naturally the next
 * time the host sets/changes the password via hashPassword().
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(plain, salt, SCRYPT_KEYLEN);
    let expected: Buffer;
    try {
      expected = Buffer.from(hash, "hex");
    } catch {
      return false;
    }
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  }

  // Legacy path — unsalted SHA-256, stored as a bare 64-char hex string.
  const legacy = createHash("sha256").update(plain).digest();
  let storedBuf: Buffer;
  try {
    storedBuf = Buffer.from(stored, "hex");
  } catch {
    return false;
  }
  if (legacy.length !== storedBuf.length) return false;
  return timingSafeEqual(legacy, storedBuf);
}
