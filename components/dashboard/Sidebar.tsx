"use client";

import { UserButton } from "@clerk/nextjs";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Overview", icon: "⌂" },
  { href: "/app/editor", label: "Editor", icon: "✎" },
  { href: "/app/rsvps", label: "RSVPs", icon: "✉" },
  { href: "/app/analytics", label: "Analytics", icon: "◎" },
  { href: "/app/billing", label: "Billing", icon: "◇" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "sidebar-transition relative flex h-screen flex-col overflow-hidden",
        "border-r border-dash-border bg-dash-bg shrink-0",
        collapsed ? "w-14" : "w-[240px]",
      )}
    >
      {/* ── Logo ───────────────────────────────────────────────────────── */}
      <div
        className={clsx(
          "flex h-16 items-center border-b border-dash-border px-3 shrink-0",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2.5 min-w-0"
          >
            <span className="text-dash-gold text-lg shrink-0">✦</span>
            <span className="font-label text-[11px] tracking-[0.35em] uppercase text-dash-gold truncate">
              Ceremonia
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/app/dashboard">
            <span className="text-dash-gold text-lg">✦</span>
          </Link>
        )}
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5",
                "font-label text-[11px] tracking-[0.3em] uppercase",
                "transition-all duration-150",
                active
                  ? "bg-dash-gold/10 text-dash-gold"
                  : "text-dash-text/40 hover:bg-dash-gold/5 hover:text-dash-gold/80",
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-dash-gold" />
              )}

              <span className="shrink-0 text-base w-5 text-center">{icon}</span>

              {/* Label — hidden when collapsed, fade transition */}
              <span
                className={clsx(
                  "truncate transition-all duration-200",
                  collapsed
                    ? "w-0 opacity-0 overflow-hidden"
                    : "w-auto opacity-100",
                )}
              >
                {label}
              </span>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span
                  className={clsx(
                    "pointer-events-none absolute left-full ml-2 z-50",
                    "whitespace-nowrap rounded-md px-2.5 py-1.5",
                    "bg-dash-surface border border-dash-border",
                    "font-label text-[10px] tracking-widest uppercase text-dash-gold",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                    "shadow-lg",
                  )}
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: UserButton + collapse toggle ───────────────────────── */}
      <div className="shrink-0 border-t border-dash-border p-3 space-y-2">
        {/* Clerk UserButton */}
        <div
          className={clsx(
            "flex items-center gap-3 rounded-lg px-1.5 py-1.5",
            "transition-all duration-150 hover:bg-dash-gold/5",
          )}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-7 h-7 shrink-0",
                userButtonPopoverCard: "bg-dash-surface border-dash-border",
              },
            }}
          />
          {!collapsed && (
            <span className="font-display italic text-sm text-dash-text/50 truncate">
              Account
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={clsx(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2",
            "font-label text-[10px] tracking-widest uppercase",
            "text-dash-text/30 hover:text-dash-gold/60 hover:bg-dash-gold/5",
            "transition-all duration-150",
            collapsed && "justify-center",
          )}
        >
          <span
            className={clsx(
              "text-base transition-transform duration-300",
              collapsed ? "rotate-180" : "rotate-0",
            )}
          >
            ‹‹
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
