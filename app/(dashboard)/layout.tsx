import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Minimal shell for now — full nav comes in Week 2 */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <span className="font-semibold tracking-widest text-sm text-zinc-400">
          CEREMONIA
        </span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
