import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { weddings } from "@/db/schema";

interface Props {
  params: Promise<{ host: string }>;
}

export default async function CustomDomainPage({ params }: Props) {
  const { host } = await params;

  const [wedding] = await db
    .select({ slug: weddings.slug })
    .from(weddings)
    .where(eq(weddings.customDomain, host))
    .limit(1);

  if (!wedding) notFound();

  // Redirect to the slug route which has all the rendering logic
  redirect(`/wedding/${wedding.slug}`);
}
