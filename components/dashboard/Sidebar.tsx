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
  MenuIcon,
  PenLineIcon,
  SettingsIcon,
  SparklesIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Tooltip } from "@/components/ui/Tooltip";
import { useNavigationBlocker } from "@/contexts/NavigationGuardContext";

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

interface NavLinksProps {
  collapsed: boolean;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  isBlocked: boolean;
  confirmExit: () => Promise<boolean>;
  setIsBlocked: (blocked: boolean) => void;
  onNavigate?: () => void;
}

const NavLinks = ({
  collapsed,
  isPending,
  startTransition,
  isBlocked,
  confirmExit,
  setIsBlocked,
  onNavigate,
}: NavLinksProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleNav = useCallback(
    async (href: string) => {
      if (isBlocked) {
        const confirmed = await confirmExit();
        if (confirmed) {
          setIsBlocked(false);
          onNavigate?.();
          startTransition(() => router.push(href));
        }
      } else {
        onNavigate?.();
        startTransition(() => router.push(href));
      }
    },
    [isBlocked, confirmExit, setIsBlocked, onNavigate, startTransition, router],
  );

  return (
    <>
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");

        const link = (
          <Link
            key={href}
            href={href}
            onClick={(e) => {
              e.preventDefault();
              handleNav(href);
            }}
            className={clsx(
              "group relative flex items-center gap-3 h-9 rounded-lg px-3! py-2.5! font-label text-[12px] tracking-[0.3em] uppercase transition-all duration-150 font-semibold",
              active
                ? "bg-dash-gold/10 text-dash-gold"
                : "text-dash-text/40 hover:bg-dash-gold/5 hover:text-dash-gold/80",
              (isPending || active) && "pointer-events-none",
              collapsed && "justify-center",
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
          </Link>
        );

        return (
          <Tooltip
            key={href}
            content={label}
            position="right"
            delay={200}
            showWhen={collapsed}
          >
            {link}
          </Tooltip>
        );
      })}
    </>
  );
};

export function Sidebar() {
  // On md+ start expanded; below md the desktop sidebar is hidden entirely
  const [collapsed, setCollapsed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isBlocked, setIsBlocked, confirmExit } = useNavigationBlocker();

  useEffect(() => setMounted(true), []);

  // Close sheet on route change
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => setSheetOpen(false), [pathname]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const handleLogoNav = useCallback(
    async (href: string, onSuccess?: () => void) => {
      if (isBlocked) {
        const confirmed = await confirmExit();
        if (confirmed) {
          setIsBlocked(false);
          onSuccess?.();
          startTransition(() => router.push(href));
        }
      } else {
        onSuccess?.();
        startTransition(() => router.push(href));
      }
    },
    [isBlocked, confirmExit, setIsBlocked, startTransition, router],
  );

  return (
    <>
      {/* ── Mobile hamburger (visible below md) ─────────────────────── */}
      <div className="md:hidden fixed top-3 left-3 z-40 flex items-center gap-2.5 bg-dash-bg/90 backdrop-blur-sm border border-dash-border rounded-xl px-3 py-2">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center justify-center text-dash-gold"
        >
          <MenuIcon className="size-4" />
        </button>
        <span className="font-label font-bold text-[13px] tracking-[0.35em] uppercase text-dash-gold">
          Ceremonia
        </span>
      </div>

      {/* ── Mobile sheet backdrop ────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── Mobile sheet panel ───────────────────────────────────────── */}
      <aside
        className={clsx(
          "md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
          "bg-dash-bg border-r border-dash-border",
          "transition-transform duration-300",
          sheetOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sheet header */}
        <div className="flex h-16 items-center justify-between border-b border-dash-border px-4! shrink-0">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2.5"
            onClick={(e) => {
              e.preventDefault();
              handleLogoNav("/app/dashboard", () => setSheetOpen(false));
            }}
          >
            <SparklesIcon className="size-4 text-dash-gold shrink-0" />
            <span className="font-label font-bold text-[14px] tracking-[0.35em] uppercase text-dash-gold">
              Ceremonia
            </span>
          </Link>
          <button
            onClick={() => setSheetOpen(false)}
            className="flex items-center justify-center size-7 rounded-lg text-dash-text/40 hover:text-dash-gold transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Sheet nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
          <NavLinks
            collapsed={false}
            isPending={isPending}
            startTransition={startTransition}
            isBlocked={isBlocked}
            confirmExit={confirmExit}
            setIsBlocked={setIsBlocked}
            onNavigate={() => setSheetOpen(false)}
          />
        </nav>

        {/* Sheet bottom */}
        <div className="shrink-0 border-t border-dash-border p-3!">
          <div className="flex items-center gap-3 rounded-lg p-2! hover:bg-dash-gold/5 transition-all">
            <div className={clsx(!mounted && "invisible")}>
              <UserButton
                appearance={{ elements: { avatarBox: "size-7 shrink-0" } }}
              />
            </div>
            <span className="font-display font-semibold italic text-dash-text/80 truncate">
              Account
            </span>
          </div>
        </div>
      </aside>

      {/* ── Desktop sidebar (hidden below md) ───────────────────────── */}
      <aside
        className={clsx(
          "hidden md:flex sidebar-transition relative h-screen flex-col overflow-hidden",
          "border-r border-dash-border bg-dash-bg shrink-0",
          collapsed ? "w-14" : "w-[240px]",
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "flex h-16 items-center border-b border-dash-border px-3! shrink-0",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <Link
              href="/app/dashboard"
              onClick={(e) => {
                e.preventDefault();
                handleLogoNav("/app/dashboard");
              }}
            >
              <SparklesIcon className="size-5 text-dash-gold" />
            </Link>
          ) : (
            <Link
              href="/app/dashboard"
              className="flex items-center gap-2.5 min-w-0"
              onClick={(e) => {
                e.preventDefault();
                handleLogoNav("/app/dashboard");
              }}
            >
              <SparklesIcon className="size-4 text-dash-gold shrink-0" />
              <span className="font-label text-[14px] tracking-[0.35em] uppercase text-dash-gold truncate">
                Ceremonia
              </span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 flex flex-col gap-2">
          <NavLinks
            collapsed={collapsed}
            isPending={isPending}
            startTransition={startTransition}
            isBlocked={isBlocked}
            confirmExit={confirmExit}
            setIsBlocked={setIsBlocked}
          />
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-dash-border p-3! space-y-2!">
          <div
            className={clsx(
              "flex items-center gap-3 rounded-lg p-2!",
              "transition-all duration-150 hover:bg-dash-gold/5",
              collapsed && "justify-center",
            )}
          >
            <div className={clsx(!mounted && "invisible")}>
              <UserButton
                appearance={{ elements: { avatarBox: "size-7 shrink-0" } }}
              />
            </div>
            {!collapsed && (
              <span className="font-display font-semibold italic text-dash-text/80 truncate">
                Account
              </span>
            )}
          </div>

          <Tooltip
            content={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            position="right"
            delay={200}
            showWhen={collapsed}
          >
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-2.5! py-2! font-label text-[10px] tracking-widest uppercase text-dash-text/30 hover:text-dash-gold/60 hover:bg-dash-gold/5 transition-all duration-150 cursor-pointer",
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
          </Tooltip>
        </div>
      </aside>
    </>
  );
}
