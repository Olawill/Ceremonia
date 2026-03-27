"use client";
import { formatPrice } from "@/components/sections/Registry";
import { useTheme } from "@/lib/ThemeContext";
import {
  CheckIcon,
  ExternalLinkIcon,
  GiftIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

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

export function RegistryPanel({
  eventSlug,
  label,
}: {
  eventSlug: string;
  label?: string;
}) {
  const { theme } = useTheme();
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [myClaims, setMyClaims] = useState<Record<string, ClaimRecord>>({});
  const [guestName, setGuestName] = useState("");
  const [nameMode, setNameMode] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    try {
      const s = localStorage.getItem(`registry-claims-${eventSlug}`);
      if (s) setMyClaims(JSON.parse(s));
    } catch {}
    fetch(`/api/registry/public/${eventSlug}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventSlug]);

  // Auto-cycle items
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(
      () => setActiveIndex((p) => (p + 1) % items.length),
      5000,
    );
    return () => clearInterval(t);
  }, [items.length]);

  if (loading || !items.length) return null;
  const item = items[activeIndex];
  if (!item) return null;

  const isClaimed = !!myClaims[item.id];
  const fullyPurchased = item.purchasedCount >= (item.quantity ?? 1);
  const fullyReserved = item.totalClaimed >= (item.quantity ?? 1) && !isClaimed;

  const persistClaims = (c: Record<string, ClaimRecord>) => {
    setMyClaims(c);
    localStorage.setItem(`registry-claims-${eventSlug}`, JSON.stringify(c));
  };

  const handleClaim = async () => {
    if (!guestName.trim()) {
      setNameMode(true);
      return;
    }
    setClaimingId(item.id);
    try {
      const res = await fetch("/api/registry/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, guestName }),
      });
      if (!res.ok) return;
      const { claimToken, claimId } = await res.json();
      persistClaims({ ...myClaims, [item.id]: { claimId, claimToken } });
      const updated = await fetch(`/api/registry/public/${eventSlug}`).then(
        (r) => r.json(),
      );
      setItems(updated);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-4">
      <div
        className="text-center flex flex-col items-center gap-1.5"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <GiftIcon
          className="size-6"
          style={{
            color: theme.gold,
            filter: `drop-shadow(0 0 8px ${theme.gold}60)`,
          }}
        />
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}65`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          {label ?? "Wedding Registry"}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3.5vw,26px)",
            color: theme.text,
            letterSpacing: "0.06em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Gift Ideas
        </h2>
        <p
          className="font-display italic text-xs max-w-[200px] text-center"
          style={{ color: `${theme.text}50` }}
        >
          Your presence is the greatest gift of all
        </p>
      </div>

      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        key={activeIndex}
        style={{
          border: `1px solid ${theme.gold}30`,
          background: `linear-gradient(135deg, ${theme.curtain}35, rgba(0,0,0,0.7))`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${theme.gold}20`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.3s",
          animation: "gift-in 0.5s ease",
        }}
      >
        {item.imageUrl ? (
          <div className="w-full h-20 overflow-hidden relative">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.7)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85))",
              }}
            />
            <p
              className="absolute bottom-2 left-3 right-3 font-display text-sm"
              style={{
                color: "#F5F0E8",
                textShadow: "0 2px 8px rgba(0,0,0,0.9)",
              }}
            >
              {item.title}
            </p>
          </div>
        ) : (
          <div className="px-4! pt-3! pb-1!">
            <p className="font-display text-sm" style={{ color: theme.text }}>
              {item.title}
            </p>
          </div>
        )}
        <div className="px-4! py-3! flex flex-col gap-2">
          {item.retailer && (
            <p
              className="font-label text-[8px] tracking-widest uppercase"
              style={{ color: `${theme.gold}65` }}
            >
              {item.retailer}
            </p>
          )}
          {item.description && (
            <p
              className="font-display italic text-xs leading-snug"
              style={{ color: `${theme.text}65` }}
            >
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            {item.price ? (
              <p
                className="font-display text-sm font-semibold"
                style={{ color: theme.gold }}
              >
                {formatPrice(item.price, item.currency ?? "USD", true)}
              </p>
            ) : (
              <div />
            )}
            {fullyPurchased && (
              <span
                className="flex items-center gap-1 font-label text-[8px] uppercase"
                style={{ color: `${theme.gold}70` }}
              >
                <CheckIcon className="size-2.5" />
                Purchased
              </span>
            )}
          </div>
          {nameMode && (
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3! py-1.5! rounded-lg text-xs font-display outline-none"
              style={{
                background: `${theme.bg}CC`,
                border: `1px solid ${theme.gold}30`,
                color: theme.text,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setNameMode(false);
                  handleClaim();
                }
              }}
            />
          )}
          <div className="flex gap-2 mt-1!">
            {item.productUrl && (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5! rounded-xl text-center flex items-center justify-center gap-1 font-label text-[8px] tracking-[0.3em] uppercase hover:opacity-70"
                style={{
                  border: `1px solid ${theme.gold}30`,
                  color: `${theme.gold}70`,
                }}
              >
                <ExternalLinkIcon className="size-2.5" /> View
              </a>
            )}
            {!fullyPurchased && !isClaimed && (
              <button
                onClick={handleClaim}
                disabled={fullyReserved || !!claimingId}
                className="flex-1 py-1.5! rounded-xl font-label text-[8px] tracking-[0.3em] uppercase cursor-pointer hover:opacity-80 disabled:opacity-40"
                style={{
                  background: fullyReserved ? "transparent" : theme.curtain,
                  border: `1px solid ${theme.gold}${fullyReserved ? "20" : "40"}`,
                  color: fullyReserved ? `${theme.text}30` : theme.gold,
                }}
              >
                {fullyReserved
                  ? "Reserved"
                  : claimingId
                    ? "…"
                    : "I'll buy this"}
              </button>
            )}
            {isClaimed && (
              <button
                className="flex-1 py-1.5! rounded-xl flex items-center justify-center gap-1 font-label text-[8px] uppercase cursor-pointer"
                style={{
                  background: `${theme.gold}18`,
                  border: `1px solid ${theme.gold}50`,
                  color: theme.gold,
                }}
              >
                <ShoppingBagIcon className="size-2.5" /> I bought this
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 items-center">
        {items.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="rounded-full transition-all cursor-pointer"
            style={{
              width: i === activeIndex ? 14 : 4,
              height: 4,
              background: i === activeIndex ? theme.gold : `${theme.gold}30`,
              border: `1px solid ${theme.gold}40`,
            }}
          />
        ))}
        {items.length > 8 && (
          <span
            className="font-label text-[7px]"
            style={{ color: `${theme.gold}40` }}
          >
            +{items.length - 8}
          </span>
        )}
      </div>
      <style>{`@keyframes gift-in { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
