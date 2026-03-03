"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { weddings } from "@/db/schema";

import { verifyPassword } from "@/lib/password";

export async function unlockWedding(slug: string, password: string) {
  const [wedding] = await db
    .select({ password: weddings.password })
    .from(weddings)
    .where(eq(weddings.slug, slug))
    .limit(1);

  if (!wedding?.password || !verifyPassword(password, wedding.password)) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(`wedding-${slug}-unlocked`, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: `/wedding/${slug}`,
  });

  return { success: true };
}
