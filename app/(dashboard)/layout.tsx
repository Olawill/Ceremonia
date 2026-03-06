import type { Metadata } from "next";

import { Sidebar } from "@/components/dashboard/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Ceremonia Dashboard",
  },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-dash-bg text-dash-text overflow-hidden">
      <Sidebar />
      <main className="flex-1! p-10! max-w-6xl! mx-auto! w-full! overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
