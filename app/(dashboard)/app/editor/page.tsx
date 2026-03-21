import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { events } from "@/db/schema";

export default async function EditorIndexPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // If user has events, go to their first one. Otherwise start a new one.
  const [first] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.updatedAt))
    .limit(1);

  redirect(first ? `/app/editor/${first.slug}` : "/app/editor/new");
}
