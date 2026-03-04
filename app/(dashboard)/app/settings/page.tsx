import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Plan } from "@/lib/plans";

import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const [user] = await db
    .select({
      email: users.email,
      plan: users.plan,
      brandName: users.brandName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <SettingsClient
      email={user?.email ?? ""}
      plan={(user?.plan ?? "free") as Plan}
      clerkFirstName={clerkUser?.firstName ?? ""}
      clerkLastName={clerkUser?.lastName ?? ""}
      clerkImageUrl={clerkUser?.imageUrl ?? ""}
      brandName={user?.brandName ?? ""}
    />
  );
}
