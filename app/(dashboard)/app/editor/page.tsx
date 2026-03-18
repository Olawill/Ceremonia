import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { weddings } from "@/db/schema";

export default async function EditorIndexPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // If user has weddings, go to their first one. Otherwise start a new one.
  const [first] = await db
    .select({ slug: weddings.slug })
    .from(weddings)
    .where(eq(weddings.userId, userId))
    .orderBy(desc(weddings.updatedAt))
    .limit(1);

  redirect(first ? `/app/editor/${first.slug}` : "/app/editor/new");
}
