import { db } from "@/db";
import { weddings } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const { userId } = await auth();

  // Server-side fetch — no useEffect, no loading state
  const myWeddings = userId
    ? await db.select().from(weddings).where(eq(weddings.userId, userId))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest mb-8">
        Your Weddings
      </h1>
      {myWeddings.length === 0 ? (
        <p className="text-zinc-500">No weddings yet. Create your first one.</p>
      ) : (
        <ul className="space-y-4">
          {myWeddings.map((w) => (
            <li key={w.id} className="p-4 border border-zinc-800 rounded-lg">
              <span className="font-display text-lg">
                {w.bride} & {w.groom}
              </span>
              <span className="ml-4 text-zinc-500 text-sm">
                {w.slug}.ceremonia.app
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
