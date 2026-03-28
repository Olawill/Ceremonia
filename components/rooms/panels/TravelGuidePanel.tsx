// ── TravelGuidePanel.tsx ──────────────────────────────────────────────────────
"use client";
import { useTheme } from "@/lib/ThemeContext";
import type { TravelItem } from "@/types/event";
import { BedDoubleIcon, MapPinIcon, PlaneIcon } from "lucide-react";
import { useEffect, useState } from "react";

const ICONS = { hotel: BedDoubleIcon, airport: PlaneIcon, tip: MapPinIcon };

// ── Ink-stamp map pin ─────────────────────────────────────────────────────────
function MapPinSVG({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg viewBox="0 0 60 80" fill="none" className="w-8">
      <path
        d="M30,4 C16,4 6,14 6,28 C6,46 30,76 30,76 C30,76 54,46 54,28 C54,14 44,4 30,4 Z"
        fill={`${curtain}80`}
        stroke={`${gold}60`}
        strokeWidth="1.5"
      />
      <circle
        cx="30"
        cy="28"
        r="10"
        fill={`${gold}40`}
        stroke={`${gold}70`}
        strokeWidth="1"
      />
      <circle cx="30" cy="28" r="4" fill={gold} opacity="0.9" />
    </svg>
  );
}

export function TravelGuidePanel({
  items,
  city,
  sectionLabel,
}: {
  items: TravelItem[];
  city: string;
  sectionLabel?: string; // vocab.travelLabel
}) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setInterval(
      () => setActiveIndex((p) => (p + 1) % items.length),
      4000,
    );
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const active = items[activeIndex];
  const Icon = ICONS[active.type];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-5">
      {/* Heading with map pin */}
      <div
        className="flex flex-col items-center gap-2 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <MapPinSVG gold={theme.gold} curtain={theme.curtain} />
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}65`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Getting to {city}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3.5vw,28px)",
            color: theme.text,
            letterSpacing: "0.06em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {sectionLabel ?? "Travel & Stay"}
        </h2>
        <div
          className="h-px w-16"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}60, transparent)`,
          }}
        />
      </div>

      {/* Type filter pills */}
      <div
        className="flex gap-1.5"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
        }}
      >
        {(["hotel", "airport", "tip"] as const)
          .filter((type) => items.some((i) => i.type === type))
          .map((type) => {
            const TypeIcon = ICONS[type];
            const count = items.filter((i) => i.type === type).length;
            return (
              <button
                key={type}
                onClick={() => {
                  const idx = items.findIndex((i) => i.type === type);
                  if (idx !== -1) setActiveIndex(idx);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-full cursor-pointer transition-all font-label text-[7px] tracking-[0.3em] uppercase"
                style={{
                  border: `1px solid ${active.type === type ? theme.gold + "60" : theme.gold + "20"}`,
                  color: active.type === type ? theme.gold : `${theme.gold}45`,
                  background:
                    active.type === type ? `${theme.gold}15` : "transparent",
                }}
              >
                <TypeIcon className="size-2.5" />
                {type} ({count})
              </button>
            );
          })}
      </div>

      {/* Active item card — styled as a travel ticket */}
      <div
        key={activeIndex}
        className="w-full max-w-xs"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.3s",
          animation: "ticket-in 0.5s ease",
        }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: `1px solid ${theme.gold}35`,
            background: `linear-gradient(135deg, ${theme.curtain}40, rgba(0,0,0,0.7))`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${theme.gold}20`,
          }}
        >
          {/* Ticket tear line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "55%",
              height: 1,
              borderTop: `1px dashed ${theme.gold}20`,
            }}
          >
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              style={{ background: "rgba(0,0,0,0.6)" }}
            />
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              style={{ background: "rgba(0,0,0,0.6)" }}
            />
          </div>

          {/* Top section */}
          <div className="px-5 pt-4 pb-8 flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 36,
                height: 36,
                background: `${theme.gold}20`,
                border: `1px solid ${theme.gold}40`,
              }}
            >
              <Icon className="size-4" style={{ color: theme.gold }} />
            </div>
            <div>
              <p
                className="font-label text-[9px] tracking-[0.4em] uppercase"
                style={{ color: `${theme.gold}70` }}
              >
                {active.type}
              </p>
              <p
                className="font-display text-base leading-tight mt-0.5"
                style={{
                  color: theme.text,
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                }}
              >
                {active.name}
              </p>
            </div>
          </div>

          {/* Bottom section */}
          <div className="px-5 pt-4 pb-4">
            <p
              className="font-display italic text-sm leading-relaxed"
              style={{ color: `${theme.text}75` }}
            >
              {active.description}
            </p>
            {active.link && (
              <a
                href={active.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-label text-[8px] tracking-[0.4em] uppercase transition-opacity hover:opacity-70"
                style={{ color: theme.gold }}
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pips */}
      <div className="flex gap-1.5">
        {items.map((_, i) => (
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
      </div>

      <style>{`@keyframes ticket-in { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}
