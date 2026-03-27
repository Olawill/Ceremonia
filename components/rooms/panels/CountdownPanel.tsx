"use client";

import { useTheme } from "@/lib/ThemeContext";
import { createCountDownLoaction, formattedDate } from "@/lib/helper";
import {
  DEMO_EVENT_CONFIG,
  FALLBACK_LOCATION,
  VenueEvent,
} from "@/types/event";
import { useEffect, useRef, useState } from "react";

interface Props {
  date?: string;
  location?: VenueEvent;
  eventLabel?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(eventDate: Date): TimeLeft {
  const diff = eventDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ── Carved stone digit — looks like it's chiselled into the wall ──────────────
function StoneDigit({
  value,
  label,
  gold,
  text,
  curtain,
  index,
  visible,
}: {
  value: number;
  label: string;
  gold: string;
  text: string;
  curtain: string;
  index: number;
  visible: boolean;
}) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      prev.current = value;
      const t = setTimeout(() => setFlash(false), 350);
      return () => clearTimeout(t);
    }
  }, [value]);

  const displayVal = String(value).padStart(2, "0");

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(20px) scale(0.9)",
        transition: `opacity 0.8s ease ${index * 0.12}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s`,
      }}
    >
      {/* Stone block */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 72,
          height: 80,
          borderRadius: 8,
          background: `linear-gradient(160deg, ${curtain}50 0%, rgba(0,0,0,0.6) 100%)`,
          border: `1px solid ${gold}30`,
          boxShadow: `
            inset 0 2px 4px rgba(0,0,0,0.6),
            inset 0 -1px 0 ${gold}15,
            0 4px 24px rgba(0,0,0,0.5),
            0 0 ${flash ? "30px" : "0px"} ${gold}30
          `,
          transition: "box-shadow 0.35s ease",
        }}
      >
        {/* Engraved line through middle */}
        <div
          className="absolute left-3 right-3 h-px"
          style={{ top: "50%", background: `${gold}20` }}
        />

        {/* Corner notches */}
        {[
          "top-1 left-1",
          "top-1 right-1",
          "bottom-1 left-1",
          "bottom-1 right-1",
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-2 h-2`}
            style={{
              borderTop: i < 2 ? `1px solid ${gold}25` : "none",
              borderBottom: i >= 2 ? `1px solid ${gold}25` : "none",
              borderLeft: i % 2 === 0 ? `1px solid ${gold}25` : "none",
              borderRight: i % 2 === 1 ? `1px solid ${gold}25` : "none",
            }}
          />
        ))}

        {/* The number */}
        <span
          className="font-label text-3xl font-semibold tabular-nums relative z-10"
          style={{
            color: flash ? gold : `${gold}DD`,
            textShadow: `0 0 ${flash ? "20px" : "8px"} ${gold}${flash ? "80" : "40"}`,
            transition: "color 0.2s ease, text-shadow 0.2s ease",
            letterSpacing: "0.05em",
          }}
        >
          {displayVal}
        </span>

        {/* Flash shimmer */}
        {flash && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 30%, ${gold}18 50%, transparent 70%)`,
              animation: "stone-flash 0.35s ease forwards",
            }}
          />
        )}
      </div>

      {/* Label carved below */}
      <p
        className="font-label font-bold text-[11px] tracking-[0.5em] uppercase"
        style={{ color: `${gold}90` }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Hourglass SVG ornament ────────────────────────────────────────────────────
function HourglassSVG({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
      {/* Top bulb */}
      <path
        d="M4,4 Q4,18 16,24 Q28,18 28,4 Z"
        fill={`${curtain}40`}
        stroke={`${gold}60`}
        strokeWidth="1"
      />
      {/* Bottom bulb */}
      <path
        d="M4,44 Q4,30 16,24 Q28,30 28,44 Z"
        fill={`${curtain}30`}
        stroke={`${gold}60`}
        strokeWidth="1"
      />
      {/* Sand top */}
      <path d="M8,6 Q8,16 16,22 Q24,16 24,6 Z" fill={`${gold}25`} />
      {/* Sand bottom — small pile */}
      <ellipse cx="16" cy="41" rx="6" ry="2" fill={`${gold}35`} />
      {/* Sand stream */}
      <line
        x1="16"
        y1="22"
        x2="16"
        y2="38"
        stroke={`${gold}50`}
        strokeWidth="0.8"
        strokeDasharray="1 2"
      />
      {/* Frame */}
      <rect
        x="2"
        y="2"
        width="28"
        height="3"
        rx="1.5"
        fill={`${gold}50`}
        stroke={`${gold}70`}
        strokeWidth="0.5"
      />
      <rect
        x="2"
        y="43"
        width="28"
        height="3"
        rx="1.5"
        fill={`${gold}50`}
        stroke={`${gold}70`}
        strokeWidth="0.5"
      />
      <rect x="14" y="2" width="4" height="44" rx="2" fill={`${gold}20`} />
    </svg>
  );
}

export function CountdownPanel({
  date,
  location = FALLBACK_LOCATION,
  eventLabel = "Wedding",
}: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayDate = date ?? DEMO_EVENT_CONFIG.date;
  const [year, month, day] = displayDate.split("-").map(Number);
  const local = new Date(year, month - 1, day);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(local));

  useEffect(() => {
    const tick = setInterval(() => setTimeLeft(getTimeLeft(local)), 1000);
    return () => clearInterval(tick);
  }, []);

  // Trigger entrance animation on mount with a short delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6!"
    >
      <style>{`
        @keyframes stone-flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes sand-fall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
      `}</style>

      {/* ── Heading ── */}
      <div
        className="flex flex-col items-center gap-3 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-16px)",
          transition:
            "opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Hourglass ornament */}
        <HourglassSVG gold={theme.gold} curtain={theme.curtain} />

        <p
          className="font-label text-[11px] tracking-[0.6em] uppercase"
          style={{ color: `${theme.gold}` }}
        >
          Until {eventLabel === "Wedding" ? "We Say I Do" : "The Big Day"}
        </p>

        <h2
          className="font-display font-bold"
          style={{
            fontSize: "clamp(24px,4.5vw,40px)",
            color: theme.text,
            letterSpacing: "0.08em",
            textShadow: `0 2px 16px rgba(0,0,0,0.8), 0 0 30px ${theme.gold}15`,
          }}
        >
          Counting Down
        </h2>

        <div
          className="h-px w-24"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}60, transparent)`,
          }}
        />

        <p
          className="font-display font-semibold italic text-[15px]"
          style={{
            color: `${theme.gold}95`,
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          }}
        >
          {formattedDate(displayDate)} · {createCountDownLoaction(location)}
        </p>
      </div>

      {/* ── Stone digit clock ── */}
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            <StoneDigit
              value={u.value}
              label={u.label}
              gold={theme.gold}
              text={theme.text}
              curtain={theme.curtain}
              index={i}
              visible={visible}
            />
            {i < units.length - 1 && (
              <div
                className="flex flex-col gap-1.5 mb-5!"
                style={{
                  opacity: visible ? 0.5 : 0,
                  transition: "opacity 1s ease 0.5s",
                }}
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: theme.gold }}
                />
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: theme.gold }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Interlocked rings ornament ── */}
      <div
        style={{
          opacity: visible ? 0.6 : 0,
          transition: "opacity 1s ease 0.6s",
        }}
      >
        <svg width="64" height="32" viewBox="0 0 64 32" fill="none">
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="12"
            stroke={`${theme.gold}`}
            strokeWidth="1.5"
          />
          <ellipse
            cx="48"
            cy="16"
            rx="12"
            ry="12"
            stroke={`${theme.gold}`}
            strokeWidth="1.5"
          />
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="12"
            stroke={`${theme.gold}60`}
            strokeWidth="0.5"
            fill={`${theme.gold}38`}
          />
          <ellipse
            cx="48"
            cy="16"
            rx="12"
            ry="12"
            stroke={`${theme.gold}60`}
            strokeWidth="0.5"
            fill={`${theme.gold}38`}
          />
          <path
            d="M28 16 Q32 10 36 16"
            stroke={theme.gold}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}
