import { verifyToken } from "@clerk/backend";

export async function getAuthUserId(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
