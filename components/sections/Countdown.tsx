"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useRef, useState } from "react";

const WEDDING_DATE = new Date("2026-07-12T16:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountUnit({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: {
    gold: string;
    goldLight: string;
    text: string;
    curtain: string;
    bg: string;
  };
}) {
  const [flip, setFlip] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const t = setTimeout(() => setFlip(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-28 rounded-xl flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${theme.curtain}40, ${theme.bg}80)`,
          border: `1px solid ${theme.gold}35`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${theme.gold}20`,
        }}
      >
        {/* Separator line */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px opacity-30"
          style={{ background: theme.gold }}
        />

        {/* Number */}
        <span
          className="font-label text-4xl font-semibold tabular-nums"
          style={{
            color: theme.gold,
            textShadow: `0 0 20px ${theme.gold}60`,
            transform: flip ? "scale(1.15)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        >
          {String(value).padStart(2, "0")}
        </span>

        {/* Shimmer sweep on flip */}
        {flip && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 30%, ${theme.goldLight}20 50%, transparent 70%)`,
              animation: "shimmer 0.4s ease forwards",
            }}
          />
        )}
      </div>

      <p
        className="font-label text-[9px] tracking-[0.45em] uppercase"
        style={{ color: `${theme.gold}70` }}
      >
        {label}
      </p>
    </div>
  );
}

export function Countdown() {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center gap-16 py-24 px-5"
      style={{
        background: `radial-gradient(ellipse at center bottom, ${theme.curtain}25 0%, ${theme.bg} 65%)`,
      }}
    >
      {/* Heading */}
      <div
        className="text-center space-y-4 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
        }}
      >
        <p
          className="font-label uppercase tracking-[0.5em] text-[11px]"
          style={{ color: `${theme.gold}70` }}
        >
          Until We Say I Do
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(30px,5.5vw,56px)",
            color: theme.text,
            letterSpacing: "0.08em",
          }}
        >
          Counting Down
        </h2>
        <div
          className="w-16 h-px mx-auto"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />
        <p
          className="font-display italic"
          style={{ color: `${theme.gold}70`, fontSize: "clamp(14px,2vw,18px)" }}
        >
          12 July 2026 · Ashford Estate, Tuscany
        </p>
      </div>

      {/* Clock */}
      <div
        className="flex flex-wrap items-start justify-center gap-4 transition-all duration-1000 delay-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
        }}
      >
        {units.map((u, i) => (
          <div key={u.label} className="flex items-start gap-4">
            <CountUnit value={u.value} label={u.label} theme={theme} />
            {i < units.length - 1 && (
              <span
                className="font-display text-3xl mt-8 leading-none select-none"
                style={{ color: `${theme.gold}50` }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Decorative ring */}
      <div
        className="transition-all duration-1000 delay-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
          <ellipse
            cx="20"
            cy="20"
            rx="14"
            ry="14"
            stroke={`${theme.gold}60`}
            strokeWidth="1.5"
          />
          <ellipse
            cx="60"
            cy="20"
            rx="14"
            ry="14"
            stroke={`${theme.gold}60`}
            strokeWidth="1.5"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="14"
            ry="14"
            stroke={`${theme.gold}30`}
            strokeWidth="0.5"
            fill={`${theme.gold}08`}
          />
          <ellipse
            cx="60"
            cy="20"
            rx="14"
            ry="14"
            stroke={`${theme.gold}30`}
            strokeWidth="0.5"
            fill={`${theme.gold}08`}
          />
          <path
            d="M34 20 Q40 14 46 20"
            stroke={theme.gold}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>
    </section>
  );
}
