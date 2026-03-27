"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { VenueEvent } from "@/types/event";
import { useEffect, useState } from "react";

interface Props {
  details: VenueEvent[];
}

// ── Blueprint floor-plan SVG ──────────────────────────────────────────────────
function BlueprintSVG({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="w-full opacity-40">
      {/* Outer walls */}
      <rect
        x="10"
        y="10"
        width="180"
        height="120"
        stroke={`${gold}90`}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner rooms */}
      <rect
        x="10"
        y="10"
        width="90"
        height="60"
        stroke={`${gold}80`}
        strokeWidth="0.8"
        fill={`${gold}04`}
      />
      <rect
        x="100"
        y="10"
        width="90"
        height="60"
        stroke={`${gold}80`}
        strokeWidth="0.8"
        fill={`${gold}04`}
      />
      <rect
        x="10"
        y="70"
        width="180"
        height="60"
        stroke={`${gold}80`}
        strokeWidth="0.8"
        fill={`${gold}06`}
      />
      {/* Door arcs */}
      <path
        d="M100,10 A15,15 0 0,1 100,40"
        stroke={`${gold}`}
        strokeWidth="0.6"
        fill="none"
        strokeDasharray="2 2"
      />
      <path
        d="M10,70 A15,15 0 0,1 40,70"
        stroke={`${gold}`}
        strokeWidth="0.6"
        fill="none"
        strokeDasharray="2 2"
      />
      {/* Room labels */}
      <text
        x="55"
        y="44"
        fill={`${gold}`}
        fontSize="7"
        textAnchor="middle"
        fontFamily="monospace"
      >
        CEREMONY
      </text>
      <text
        x="145"
        y="44"
        fill={`${gold}`}
        fontSize="7"
        textAnchor="middle"
        fontFamily="monospace"
      >
        GARDEN
      </text>
      <text
        x="100"
        y="105"
        fill={`${gold}90`}
        fontSize="8"
        textAnchor="middle"
        fontFamily="monospace"
      >
        RECEPTION HALL
      </text>
      {/* Compass */}
      <circle
        cx="175"
        cy="125"
        r="8"
        stroke={`${gold}80`}
        strokeWidth="0.6"
        fill="none"
      />
      <text
        x="175"
        y="122"
        fill={`${gold}90`}
        fontSize="5"
        textAnchor="middle"
        fontFamily="monospace"
      >
        N
      </text>
      <line
        x1="175"
        y1="118"
        x2="175"
        y2="132"
        stroke={`${gold}80`}
        strokeWidth="0.5"
      />
      <line
        x1="168"
        y1="125"
        x2="182"
        y2="125"
        stroke={`${gold}80`}
        strokeWidth="0.5"
      />
      {/* Grid dots */}
      {Array.from({ length: 8 }).map((_, ri) =>
        Array.from({ length: 11 }).map((_, ci) => (
          <circle
            key={`${ri}-${ci}`}
            cx={10 + ci * 18}
            cy={10 + ri * 17}
            r="0.8"
            fill={`${gold}40`}
          />
        )),
      )}
    </svg>
  );
}

// ── Venue card ────────────────────────────────────────────────────────────────
function VenueCard({
  detail,
  gold,
  curtain,
  text,
  index,
  isActive,
}: {
  detail: VenueEvent;
  gold: string;
  curtain: string;
  text: string;
  index: number;
  isActive: boolean;
}) {
  const icons: Record<string, string> = {
    Ceremony: "⛪",
    Reception: "🥂",
    Location: "📍",
    Cocktails: "🍸",
    Dinner: "🍽",
    Garden: "🌿",
    Afterparty: "✨",
  };
  const icon =
    Object.entries(icons).find(([k]) =>
      detail.label.toLowerCase().includes(k.toLowerCase()),
    )?.[1] ?? "✦";

  return (
    <div
      className="flex flex-col items-center gap-1.5 transition-all duration-500"
      style={{
        opacity: isActive ? 1 : 0.65,
        transform: isActive ? "scale(1.05)" : "scale(0.95)",
      }}
    >
      <div
        className="relative flex flex-col items-center gap-2 px-4! py-3! rounded-xl text-center"
        style={{
          border: `1px solid ${isActive ? gold + "90" : gold + "70"}`,
          background: isActive
            ? `linear-gradient(160deg, ${curtain}40, rgba(0,0,0,0.6))`
            : "rgba(0,0,0,0.3)",
          minWidth: 110,
          boxShadow: isActive
            ? `0 0 20px ${gold}20, inset 0 1px 0 ${gold}20`
            : "none",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            fontSize: 24,
            filter: isActive ? `drop-shadow(0 0 8px ${gold}80)` : "none",
          }}
        >
          {icon}
        </span>
        <p
          className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase"
          style={{ color: `${gold}` }}
        >
          {detail.label}
        </p>
        <p
          className="font-display font-semibold text-sm"
          style={{ color: text, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
        >
          {detail.value}
        </p>
        {detail.sub && (
          <p
            className="font-display font-bold italic text-[13px]"
            style={{ color: `${text}85` }}
          >
            {detail.sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function VenueDetailsPanel({ details }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setActiveCard((p) => (p + 1) % details.length),
      3000,
    );
    return () => clearInterval(t);
  }, [details.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-4">
      {/* Blueprint on wall */}
      <div
        className="w-full max-w-xs"
        style={{
          opacity: visible ? 0.7 : 0,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
        }}
      >
        <div
          className="relative rounded-xl overflow-hidden p-3!"
          style={{
            border: `1px solid ${theme.gold}90`,
            background: `linear-gradient(160deg, ${theme.curtain}30, rgba(0,0,0,0.6))`,
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Blueprint label */}
          <p
            className="font-label font-semibold text-[9px] tracking-[0.5em] uppercase text-center mb-2!"
            style={{ color: `${theme.gold}` }}
          >
            VENUE LAYOUT
          </p>
          <BlueprintSVG gold={theme.gold} curtain={theme.curtain} />
        </div>
      </div>

      {/* Heading */}
      <div
        className="text-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.3s",
        }}
      >
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3vw,26px)",
            color: theme.text,
            letterSpacing: "0.07em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Venue Details
        </h2>
      </div>

      {/* Detail cards */}
      <div
        className="flex gap-3 flex-wrap justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.4s",
        }}
      >
        {details.map((d, i) => (
          <VenueCard
            key={d.label}
            detail={d}
            gold={theme.gold}
            curtain={theme.curtain}
            text={theme.text}
            index={i}
            isActive={i === activeCard}
          />
        ))}
      </div>

      {/* Pip dots */}
      <div className="flex gap-1.5">
        {details.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveCard(i)}
            className="rounded-full transition-all cursor-pointer"
            style={{
              width: i === activeCard ? 14 : 4,
              height: 4,
              background: i === activeCard ? theme.gold : `${theme.gold}30`,
              border: `1px solid ${theme.gold}40`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
