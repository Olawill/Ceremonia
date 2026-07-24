import { timingSafeEqual } from "crypto";

/**
 * Constant-time string equality — use for comparing secret tokens (claim
 * tokens, API keys, etc.) supplied by the caller against a stored value, so
 * a network-timing attack can't learn the value one character at a time.
 * A length mismatch returns false immediately; that only reveals the
 * expected length, not any byte of the secret, so it's safe to short-circuit.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
