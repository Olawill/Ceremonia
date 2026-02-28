import { auth, currentUser } from "@clerk/nextjs/server";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const cinzel = Cinzel({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Overview", icon: "◈" },
  { href: "/app/editor", label: "Editor", icon: "✦" },
  { href: "/app/rsvps", label: "RSVPs", icon: "✉" },
  { href: "/app/analytics", label: "Analytics", icon: "⬡" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  return (
    <div
      className={`${cormorant.variable} ${cinzel.variable} min-h-screen flex`}
      style={{ background: "#080808", color: "#F5F0E8" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r"
        style={{ borderColor: "#D4AF3718", background: "#0A0A0A" }}
      >
        {/* Logo */}
        <div className="p-8 pb-6 border-b" style={{ borderColor: "#D4AF3718" }}>
          <p
            className="font-label text-xs tracking-[0.5em] uppercase"
            style={{ color: "#D4AF3780" }}
          >
            ✦ Ceremonia
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-label text-xs
                        tracking-[0.3em] uppercase transition-all duration-200
                        hover:bg-white/5"
              style={{ color: "#D4AF3780" }}
            >
              <span style={{ color: "#D4AF37" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div
          className="p-6 border-t flex items-center gap-3"
          style={{ borderColor: "#D4AF3718" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-label"
            style={{ background: "#D4AF3730", color: "#D4AF37" }}
          >
            {user?.firstName?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p
              className="font-label text-xs tracking-widest truncate"
              style={{ color: "#F5F0E8" }}
            >
              {user?.firstName ?? "Guest"}
            </p>
            <p
              className="font-display italic text-xs truncate"
              style={{ color: "#F5F0E840" }}
            >
              Free plan
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
