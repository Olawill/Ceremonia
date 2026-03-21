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
    productId?: string;
    autoOpen?: string;
  }>;
}) {
  const { success, cancelled, productId } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ plan: users.plan, polarCustomerId: users.polarCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const plan = (user?.plan as Plan | undefined) ?? "free";
  const hasPolarAccount = plan !== "free";
  const hasEverPaid = !!user?.polarCustomerId;

  return (
    <BillingClient
      currentPlan={plan}
      hasPolarAccount={hasPolarAccount}
      hasEverPaid={hasEverPaid}
      paymentSuccess={success === "true"}
      paymentCancelled={cancelled === "true"}
      successProductId={productId}
    />
  );
}
