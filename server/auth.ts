import { verifyToken } from "@clerk/backend";

import { env } from "@/env";

export async function getAuthUserId(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
