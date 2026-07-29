"use client";

import {
  BanknoteIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GiftIcon,
  LandmarkIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { CashGiftConfig, CashGiftMethodType } from "@/types/event";
import { toast } from "sonner";

const CASH_METHOD_META: Record<CashGiftMethodType, { label: string }> = {
  venmo: { label: "Venmo" },
  paypal: { label: "PayPal" },
  zelle: { label: "Zelle" },
  cashapp: { label: "Cash App" },
  bank_transfer: { label: "Direct Deposit" },
  cash_at_event: { label: "Cash / Check at the Event" },
  other: { label: "Other" },
};

function CashGiftMethods({
  cashGift,
  theme,
}: {
  cashGift: CashGiftConfig;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      toast.error("Couldn't copy — please copy it manually");
    }
  };

  if (!cashGift.methods.length) return null;

  return (
    <div className="mb-16!">
      {cashGift.intro && (
        <p
          className="font-display italic text-sm text-center mb-8! mx-auto max-w-xl"
          style={{ color: `${theme.text}80` }}
        >
          {cashGift.intro}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {cashGift.methods.map((method) => {
          const meta = CASH_METHOD_META[method.type];
          const isCashAtEvent = method.type === "cash_at_event";
          const Icon = isCashAtEvent ? BanknoteIcon : LandmarkIcon;
          return (
            <div
              key={method.id}
              className="rounded-2xl p-4! flex flex-col gap-2"
              style={{
                background: theme.bg,
                border: `1px solid ${theme.gold}15`,
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4" style={{ color: theme.gold }} />
                <p
                  className="font-display font-semibold text-sm"
                  style={{ color: theme.text }}
                >
                  {method.label || meta.label}
                </p>
              </div>
              {!isCashAtEvent && method.value && (
                <button
                  type="button"
                  onClick={() => handleCopy(method.id, method.value!)}
                  aria-label={`Copy ${meta.label} details`}
                  className="flex items-center justify-between gap-2 px-3! py-2! rounded-lg text-sm font-display transition-colors cursor-pointer text-left"
                  style={{
                    background: `${theme.gold}08`,
                    border: `1px solid ${theme.gold}20`,
                    color: `${theme.text}90`,
                  }}
                >
                  <span className="truncate">{method.value}</span>
                  {copiedId === method.id ? (
                    <CheckIcon
                      className="size-3.5 shrink-0"
                      style={{ color: theme.gold }}
                    />
                  ) : (
                    <CopyIcon
                      className="size-3.5 shrink-0 opacity-60"
                      style={{ color: theme.gold }}
                    />
                  )}
                </button>
              )}
              {method.note && (
                <p
                  className="font-display italic text-xs"
                  style={{ color: `${theme.text}60` }}
                >
                  {method.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RegistryItem {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  productUrl?: string | null;
  retailer?: string | null;
  quantity?: number | null;
  category?: string | null;
  reservedCount: number;
  purchasedCount: number;
  totalClaimed: number;
}

interface ClaimRecord {
  claimId: string;
  claimToken: string;
}

interface Props {
  eventSlug: string;
  label?: string;
  cashGiftEnabled?: boolean;
  cashGift?: CashGiftConfig;
}

export function formatPrice(
  minorUnits: number,
  currency: string = "USD",
  fraction: boolean = false,
) {
  return new Intl.NumberFormat(undefined, {
    // `undefined` = user's browser locale
    style: "currency",
    currency,
    minimumFractionDigits: fraction ? 2 : 0,
    maximumFractionDigits: fraction ? 2 : 0,
  }).format(minorUnits / 100);
}

export function Registry({
  eventSlug,
  label,
  cashGiftEnabled,
  cashGift,
}: Props) {
  const { theme } = useTheme();
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Map itemId → claim record stored in localStorage
  const [myClaims, setMyClaims] = useState<Record<string, ClaimRecord>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [namePromptFor, setNamePromptFor] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load persisted claims from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`registry-claims-${eventSlug}`);
      if (stored) setMyClaims(JSON.parse(stored));
    } catch {}
  }, [eventSlug]);

  const persistClaims = (updated: Record<string, ClaimRecord>) => {
    setMyClaims(updated);
    localStorage.setItem(
      `registry-claims-${eventSlug}`,
      JSON.stringify(updated),
    );
  };

  // Fetch items
  useEffect(() => {
    fetch(`/api/registry/public/${eventSlug}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventSlug]);

  const handleClaim = async (itemId: string) => {
    if (!guestName.trim()) {
      setNamePromptFor(itemId);
      setTimeout(() => nameInputRef.current?.focus(), 50);
      toast.info(
        "Enter your name and confirm before you can purcahse this product",
      );
      return;
    }
    setClaimingId(itemId);
    try {
      const res = await fetch("/api/registry/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, guestName: guestName.trim() }),
      });
      if (!res.ok) return;
      const { claimToken, claimId } = await res.json();
      persistClaims({ ...myClaims, [itemId]: { claimId, claimToken } });
      // Refresh items to update counts
      const updated = await fetch(`/api/registry/public/${eventSlug}`).then(
        (r) => r.json(),
      );
      setItems(updated);
    } finally {
      setClaimingId(null);
      setNamePromptFor(null);
    }
  };

  const handleConfirmPurchase = async (itemId: string) => {
    const claim = myClaims[itemId];
    if (!claim) return;
    setConfirmingId(itemId);
    try {
      await fetch("/api/registry/confirm-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claim),
      });
      const updated = await fetch(`/api/registry/public/${eventSlug}`).then(
        (r) => r.json(),
      );
      setItems(updated);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleUnclaim = async (itemId: string) => {
    const claim = myClaims[itemId];
    if (!claim) return;
    await fetch("/api/registry/claim", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claim),
    });
    const next = { ...myClaims };
    delete next[itemId];
    persistClaims(next);
    const updated = await fetch(`/api/registry/public/${eventSlug}`).then((r) =>
      r.json(),
    );
    setItems(updated);
  };

  const hasCashGift = !!cashGiftEnabled && !!cashGift?.methods.length;
  if (loading || (items.length === 0 && !hasCashGift)) return null;

  const categories = [...new Set(items.map((i) => i.category ?? "General"))];

  return (
    <section
      className="min-h-screen flex items-center justify-center py-24! px-6!"
      style={{ background: theme.bgMid }}
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16!">
          <p
            className="font-label font-semibold text-sm tracking-[0.5em] uppercase mb-3!"
            style={{ color: `${theme.gold}90` }}
          >
            {label ?? "Wedding Registry"}
          </p>
          <h2
            className="font-display text-4xl font-light"
            style={{ color: theme.text }}
          >
            Gift Ideas
          </h2>
          <div
            className="mx-auto mt-4! h-px w-16"
            style={{ background: `${theme.gold}40` }}
          />
          <p
            className="font-display italic text-sm mt-4! w-full"
            style={{ color: `${theme.text}80` }}
          >
            Your presence is the greatest gift of all. For those who wish to
            celebrate with a gift, we've created this registry.
          </p>
        </div>

        {hasCashGift && cashGift && (
          <CashGiftMethods cashGift={cashGift} theme={theme} />
        )}

        {/* Name prompt (shown once, persists for session) */}
        {items.length > 0 && !nameConfirmed && (
          <div
            className="mb-10! p-5! rounded-2xl border text-center"
            style={{
              borderColor: `${theme.gold}20`,
              background: `${theme.gold}08`,
            }}
          >
            <p
              className="font-display italic text-sm mb-3!"
              style={{ color: theme.text }}
            >
              Enter your name so the couple knows who's gifting what
            </p>
            <div className="flex gap-2">
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="flex-1 px-4! py-2! rounded-lg text-sm font-display outline-none"
                style={{
                  background: `${theme.bg}`,
                  border: `1px solid ${theme.gold}30`,
                  color: theme.text,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && guestName.trim()) {
                    setNameConfirmed(true);
                    if (namePromptFor) handleClaim(namePromptFor);
                  }
                }}
                onBlur={() => {
                  if (guestName.trim()) {
                    setNameConfirmed(true);
                  }
                }}
              />
              {guestName.trim() && (
                <button
                  onClick={() => {
                    setNameConfirmed(true);
                    if (namePromptFor) handleClaim(namePromptFor);
                  }}
                  className="px-4! py-2! rounded-lg text-sm font-label tracking-widest uppercase transition-all"
                  style={{
                    background: `${theme.gold}20`,
                    color: theme.gold,
                    border: `1px solid ${theme.gold}40`,
                  }}
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        )}

        {/* Items by category */}
        {categories.map((cat) => (
          <div key={cat} className="mb-12!">
            {categories.length > 1 && (
              <p
                className="font-label text-[10px] tracking-[0.5em] uppercase mb-5!"
                style={{ color: `${theme.gold}60` }}
              >
                {cat}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items
                .filter((i) => (i.category ?? "General") === cat)
                .map((item) => {
                  const isClaimed = !!myClaims[item.id];
                  const myClaimStatus = isClaimed ? "reserved" : null; // simplified
                  const fullyPurchased =
                    item.purchasedCount >= (item.quantity ?? 1);
                  const fullyReserved =
                    item.totalClaimed >= (item.quantity ?? 1) && !isClaimed;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl overflow-hidden flex flex-col transition-all"
                      style={{
                        background: theme.bg,
                        border: `1px solid ${isClaimed ? theme.gold + "40" : theme.gold + "15"}`,
                        opacity: fullyPurchased && !isClaimed ? 0.6 : 1,
                      }}
                    >
                      {/* Image */}
                      {item.imageUrl ? (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="aspect-video flex items-center justify-center"
                          style={{ background: `${theme.gold}08` }}
                        >
                          <GiftIcon
                            className="size-10 opacity-20"
                            style={{ color: theme.gold }}
                          />
                        </div>
                      )}

                      <div className="p-4! flex flex-col gap-2 flex-1">
                        {/* Title & retailer */}
                        <div>
                          <p
                            className="font-display font-semibold text-base"
                            style={{ color: theme.text }}
                          >
                            {item.title}
                          </p>
                          {item.retailer && (
                            <p
                              className="font-label text-[10px] tracking-widest uppercase mt-0.5!"
                              style={{ color: `${theme.gold}70` }}
                            >
                              {item.retailer}
                            </p>
                          )}
                        </div>

                        {item.description && (
                          <p
                            className="font-display italic text-sm leading-relaxed"
                            style={{ color: `${theme.text}70` }}
                          >
                            {item.description}
                          </p>
                        )}

                        {item.price && (
                          <p
                            className="font-display text-sm font-semibold"
                            style={{ color: theme.gold }}
                          >
                            {formatPrice(
                              item.price,
                              item.currency ?? "USD",
                              true,
                            )}
                          </p>
                        )}

                        {/* Status badge */}
                        {fullyPurchased ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-label tracking-wider"
                            style={{ color: `${theme.gold}80` }}
                          >
                            <CheckIcon className="size-3" /> Purchased
                          </span>
                        ) : item.quantity && item.quantity > 1 ? (
                          <span
                            className="text-xs font-display italic"
                            style={{ color: `${theme.text}50` }}
                          >
                            {item.purchasedCount} of {item.quantity} purchased
                          </span>
                        ) : null}

                        <div className="flex gap-2 mt-auto pt-2!">
                          {/* External link */}
                          {item.productUrl && (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2! rounded-xl text-xs font-label tracking-[0.3em] uppercase text-center transition-all flex items-center justify-center gap-1.5"
                              style={{
                                border: `1px solid ${theme.gold}30`,
                                color: `${theme.gold}80`,
                              }}
                            >
                              <ExternalLinkIcon className="size-3" />
                              View
                            </a>
                          )}

                          {/* Claim / confirm purchase buttons */}
                          {!fullyPurchased &&
                            (isClaimed ? (
                              <div className="flex flex-col gap-1.5 flex-1">
                                <button
                                  onClick={() => handleConfirmPurchase(item.id)}
                                  disabled={confirmingId === item.id}
                                  className="py-2! px-1! rounded-xl text-xs font-label tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  style={{
                                    background: `${theme.gold}18`,
                                    border: `1px solid ${theme.gold}50`,
                                    color: theme.gold,
                                  }}
                                >
                                  <ShoppingBagIcon className="size-3" />
                                  {confirmingId === item.id
                                    ? "…"
                                    : "I bought this"}
                                </button>
                                <button
                                  onClick={() => handleUnclaim(item.id)}
                                  className="py-1! rounded-xl text-[10px] font-label tracking-wider uppercase text-center transition-colors cursor-pointer"
                                  style={{
                                    color: `${theme.text}30`,
                                    border: `1px solid ${theme.gold}50`,
                                  }}
                                >
                                  Release
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleClaim(item.id)}
                                disabled={
                                  fullyReserved || claimingId === item.id
                                }
                                className="flex-1 py-2! rounded-xl text-xs font-label tracking-[0.3em] uppercase transition-all cursor-pointer"
                                style={
                                  fullyReserved
                                    ? {
                                        border: `1px solid ${theme.gold}15`,
                                        color: `${theme.text}30`,
                                      }
                                    : {
                                        background: `${theme.curtain}`,
                                        border: `1px solid ${theme.gold}40`,
                                        color: theme.gold,
                                      }
                                }
                              >
                                {fullyReserved
                                  ? "Reserved"
                                  : claimingId === item.id
                                    ? "…"
                                    : "I'll buy this"}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
