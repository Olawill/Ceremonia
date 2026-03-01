import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";

import { BillingClient } from "./BillingClient";

import type { Plan } from "@/lib/plans";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ plan: users.plan, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.plan as Plan | undefined) ?? "free";
  const hasStripe = !!user?.stripeCustomerId;

  return <BillingClient currentPlan={plan} hasStripeAccount={hasStripe} />;
}
