import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";

import { BillingClient } from "./BillingClient";

import type { Plan } from "@/lib/plans";

export const metadata = { title: "Billing & Plans" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    cancelled?: string;
    priceId?: string;
  }>;
}) {
  const { success, cancelled, priceId } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ plan: users.plan, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.plan as Plan | undefined) ?? "free";
  const hasActiveSubscription = !!user?.stripeCustomerId && plan !== "free";
  const hasEverPaid = !!user?.stripeCustomerId; // has Stripe customer = went through checkout before

  return (
    <BillingClient
      currentPlan={plan}
      hasStripeAccount={hasActiveSubscription}
      hasEverPaid={hasEverPaid}
      paymentSuccess={success === "true"}
      paymentCancelled={cancelled === "true"}
      successPriceId={priceId}
    />
  );
}
