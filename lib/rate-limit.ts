import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Fixed-window rate limiter backed by Postgres (works correctly across
 * stateless/serverless invocations, unlike an in-memory counter). Row-locks
 * the counter for the given key so concurrent requests from the same caller
 * can't both slip through under the limit.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .for("update")
      .limit(1);

    const now = new Date();

    if (!row) {
      await tx.insert(rateLimits).values({ key, count: 1, windowStart: now });
      return { allowed: true };
    }

    const ageSeconds = (now.getTime() - row.windowStart.getTime()) / 1000;

    if (ageSeconds >= windowSeconds) {
      // Window expired — start a fresh one.
      await tx
        .update(rateLimits)
        .set({ count: 1, windowStart: now })
        .where(eq(rateLimits.key, key));
      return { allowed: true };
    }

    if (row.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(windowSeconds - ageSeconds),
      };
    }

    await tx
      .update(rateLimits)
      .set({ count: row.count + 1 })
      .where(eq(rateLimits.key, key));
    return { allowed: true };
  });
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
