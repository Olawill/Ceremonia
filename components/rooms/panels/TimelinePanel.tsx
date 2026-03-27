"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";

interface TimelineEvent {
  year: string;
  icon: string;
  title: string;
  desc: string;
}

interface Props {
  events?: TimelineEvent[];
}

const DEMO: TimelineEvent[] = [
  {
    year: "2019",
    icon: "✦",
    title: "How We Met",
    desc: "A chance encounter at a gallery opening changed everything. Two strangers, one conversation, infinite futures.",
  },
  {
    year: "2024",
    icon: "◆",
    title: "The Proposal",
    desc: "Under the stars in Santorini, on bended knee with trembling hands and an overflowing heart.",
  },
  {
    year: "2026",
    icon: "❧",
    title: "Forever Begins",
    desc: "Join us as we begin the greatest adventure of our lives, surrounded by everyone we love.",
  },
];

// ── Ornate portrait frame ────────────────────────────────────────────────────
function PortraitFrame({
  event,
  index,
  gold,
  curtain,
  text,
  isActive,
  onClick,
}: {
  event: TimelineEvent;
  index: number;
  gold: string;
  curtain: string;
  text: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const rotations = [-3, 1.5, -1, 2.5, -2];
  const rot = rotations[index % rotations.length];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer transition-all duration-500"
      style={{
        transform: isActive
          ? `rotate(0deg) scale(1.08) translateY(-4px)`
          : `rotate(${rot}deg) scale(1)`,
        filter: isActive ? `drop-shadow(0 8px 24px ${gold}40)` : "none",
        outline: "none",
      }}
    >
      {/* Frame */}
      <div
        className="relative"
        style={{
          width: isActive ? 140 : 100,
          transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Outer gold frame */}
        <div
          className="relative rounded-sm p-2"
          style={{
            background: `linear-gradient(135deg, ${gold}60, ${gold}30, ${gold}70, ${gold}40)`,
            boxShadow: isActive
              ? `0 0 0 1px ${gold}60, inset 0 0 0 1px ${gold}30, 0 4px 20px rgba(0,0,0,0.7)`
              : `0 0 0 1px ${gold}30, inset 0 0 0 1px ${gold}20, 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Inner canvas area */}
          <div
            className="relative flex flex-col items-center justify-center gap-2 px-3 py-4"
            style={{
              background: `linear-gradient(160deg, ${curtain}60, rgba(0,0,0,0.7))`,
              minHeight: isActive ? 120 : 88,
              transition: "min-height 0.5s ease",
            }}
          >
            {/* Year label — top of frame */}
            <p
              className="font-label font-bold text-[9px] tracking-[0.4em] uppercase"
              style={{ color: `${gold}90` }}
            >
              {event.year}
            </p>
            {/* Icon medallion */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: isActive ? 36 : 28,
                height: isActive ? 36 : 28,
                background: `radial-gradient(circle, ${gold}40, ${curtain}60)`,
                border: `1px solid ${gold}60`,
                fontSize: isActive ? 16 : 12,
                color: gold,
                boxShadow: `0 0 12px ${gold}30`,
                transition: "all 0.5s ease",
              }}
            >
              {event.icon}
            </div>
            {/* Title */}
            <p
              className="font-display font-light text-center leading-tight"
              style={{
                fontSize: isActive ? 14 : 11,
                color: text,
                letterSpacing: "0.04em",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                transition: "font-size 0.5s ease",
              }}
            >
              {event.title}
            </p>
          </div>

          {/* Corner ornaments */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: i < 2 ? 0 : "auto",
                bottom: i >= 2 ? 0 : "auto",
                left: i % 2 === 0 ? 0 : "auto",
                right: i % 2 === 1 ? 0 : "auto",
                width: 10,
                height: 10,
                background: `radial-gradient(circle, ${gold}80, transparent)`,
                borderRadius:
                  i === 0
                    ? "0 0 6px 0"
                    : i === 1
                      ? "0 0 0 6px"
                      : i === 2
                        ? "0 6px 0 0"
                        : "6px 0 0 0",
              }}
            />
          ))}
        </div>

        {/* Picture wire */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-end gap-4"
          style={{ width: "80%" }}
        >
          <div
            className="flex-1 h-px"
            style={{
              background: `${gold}50`,
              transformOrigin: "right",
              transform: `rotate(-8deg)`,
            }}
          />
          <div
            className="flex-1 h-px"
            style={{
              background: `${gold}50`,
              transformOrigin: "left",
              transform: `rotate(8deg)`,
            }}
          />
        </div>
      </div>

      {/* Plaque below frame */}
      {isActive && (
        <div
          className="px-3 py-1.5 rounded text-center mt-1"
          style={{
            background: `${gold}15`,
            border: `1px solid ${gold}30`,
            maxWidth: 160,
            animation: "fade-in 0.4s ease",
          }}
        >
          <p
            className="font-display italic text-xs leading-snug"
            style={{
              color: `${text}80`,
              textShadow: "0 1px 6px rgba(0,0,0,0.8)",
            }}
          >
            {event.desc}
          </p>
        </div>
      )}
    </button>
  );
}

export function TimelinePanel({ events }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const displayEvents = events ?? DEMO;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayEvents.length);
    }, 4000);
    return () => clearInterval(t);
  }, [displayEvents.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-6">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Gallery wall heading */}
      <div
        className="text-center flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition:
            "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p
          className="font-label text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}65`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Gallery
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(20px,3.5vw,30px)",
            color: theme.text,
            letterSpacing: "0.08em",
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
          }}
        >
          Our Story
        </h2>
        <div
          className="h-px w-16"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}60, transparent)`,
          }}
        />
      </div>

      {/* Gallery wall — portraits hanging on the 3D room wall */}
      <div
        className="flex items-end justify-center gap-4 flex-wrap"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 1s ease 0.3s",
        }}
      >
        {displayEvents.map((ev, i) => (
          <PortraitFrame
            key={`${ev.year}-${i}`}
            event={ev}
            index={i}
            gold={theme.gold}
            curtain={theme.curtain}
            text={theme.text}
            isActive={i === activeIndex}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>

      {/* Wall rail — the picture hanging rod */}
      <div
        className="absolute"
        style={{
          top: "22%",
          left: "8%",
          right: "8%",
          height: 3,
          background: `linear-gradient(90deg, transparent, ${theme.gold}40, ${theme.gold}60, ${theme.gold}40, transparent)`,
          borderRadius: 2,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.5s",
        }}
      />

      {/* Pip indicator */}
      <div className="flex gap-1.5">
        {displayEvents.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="rounded-full transition-all cursor-pointer"
            style={{
              width: i === activeIndex ? 16 : 4,
              height: 4,
              background: i === activeIndex ? theme.gold : `${theme.gold}30`,
              border: `1px solid ${theme.gold}40`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
