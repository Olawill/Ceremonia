"use client";

import { UserButton } from "@clerk/nextjs";
import clsx from "clsx";
import {
  BarChart2Icon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  MailIcon,
  PenLineIcon,
  SettingsIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: "Overview", Icon: LayoutDashboardIcon },
  { href: "/app/editor", label: "Editor", Icon: PenLineIcon },
  { href: "/app/rsvps", label: "RSVPs", Icon: MailIcon },
  { href: "/app/analytics", label: "Analytics", Icon: BarChart2Icon },
  { href: "/app/billing", label: "Billing", Icon: CreditCardIcon },
  { href: "/app/settings", label: "Settings", Icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
        {collapsed ? (
          <Link href="/app/dashboard">
            <SparklesIcon className="size-5 text-dash-gold" />
          </Link>
        ) : (
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2.5 min-w-0"
          >
            <SparklesIcon className="size-4 text-dash-gold shrink-0" />
            <span className="font-label text-[14px] tracking-[0.35em] uppercase text-dash-gold truncate">
              Ceremonia
            </span>
          </Link>
        )}
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 flex flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "group relative flex items-center gap-3 h-9 rounded-lg px-3! py-2.5",
                "font-label text-[12px] tracking-[0.3em] uppercase",
                "transition-all duration-150 font-semibold",
                active
                  ? "bg-dash-gold/10 text-dash-gold"
                  : "text-dash-text/40 hover:bg-dash-gold/5 hover:text-dash-gold/80",
                collapsed && "justify-center text-center",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-dash-gold" />
              )}

              <Icon className="size-4 shrink-0" />

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

              {collapsed && (
                <span
                  className={clsx(
                    "pointer-events-none absolute left-full ml-2 z-50",
                    "whitespace-nowrap rounded-md px-2.5 py-1.5",
                    "bg-dash-surface border border-dash-border",
                    "font-label text-[10px] tracking-widest uppercase text-dash-gold",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg",
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
        <div
          className={clsx(
            "flex items-center gap-3 rounded-lg p-2!",
            "transition-all duration-150 hover:bg-dash-gold/5",
            collapsed && "justify-center",
          )}
        >
          {mounted && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-7 shrink-0",
                  userButtonPopoverCard: "bg-dash-surface border-dash-border",
                },
              }}
            />
          )}
          {!collapsed && (
            <span className="font-display font-semibold italic text-dash-text/80 truncate">
              Account
            </span>
          )}
        </div>

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
          {collapsed ? (
            <ChevronsRightIcon className="size-4" />
          ) : (
            <>
              <ChevronsLeftIcon className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
