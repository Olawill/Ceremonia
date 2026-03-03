import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";

interface Props {
  searchParams: Promise<{ priceId?: string; mode?: string }>;
}

export default async function BillingCheckoutPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { priceId, mode } = await searchParams;

  // If no priceId, just go to billing page
  if (!priceId || !mode || (mode !== "subscription" && mode !== "payment")) {
    redirect("/app/billing");
  }

  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) redirect("/app/billing");

  const session = await stripe.checkout.sessions.create({
    mode,
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/app/billing?cancelled=true`,
    metadata: { userId },
    subscription_data:
      mode === "subscription" ? { metadata: { userId } } : undefined,
  });

  if (!session.url) redirect("/app/billing");

  redirect(session.url);
}
