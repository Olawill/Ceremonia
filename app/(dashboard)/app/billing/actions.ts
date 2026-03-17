"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Plan } from "@/lib/plans";

export async function syncPlanFromStripe(plan: Plan) {
  const { userId } = await auth();
  if (!userId) return { success: false };

  await db.update(users).set({ plan }).where(eq(users.id, userId));

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { plan },
  });

  return { success: true };
}
