"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { EventType } from "@/types/event";
import { useEffect, useState } from "react";

interface Props {
  bride?: string;
  groom?: string;
  tagLine?: string;
  heroPhotoUrl?: string;
  topLabel?: string;
  eventType?: EventType;
}

// ── Floating gold dust particles ─────────────────────────────────────────────
function GoldDust({ gold }: { gold: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background: gold,
            left: `${10 + ((i * 17) % 80)}%`,
            top: `${15 + ((i * 23) % 70)}%`,
            opacity: 0.15 + (i % 4) * 0.08,
            animation: `float-dust ${4 + (i % 5)}s ease-in-out ${i * 0.4}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-dust {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          100% { transform: translateY(-18px) translateX(${6}px); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

// ── Monogram cipher SVG ──────────────────────────────────────────────────────
function MonogramCipher({
  h1,
  h2,
  gold,
  curtain,
}: {
  h1: string;
  h2: string;
  gold: string;
  curtain: string;
}) {
  const i1 = h1.charAt(0).toUpperCase();
  const i2 = h2 ? h2.charAt(0).toUpperCase() : "";
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      {/* Outer ring */}
      <circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke={`${gold}65`}
        strokeWidth="1"
      />
      {/* Inner ring */}
      <circle
        cx="40"
        cy="40"
        r="28"
        fill="none"
        stroke={`${gold}50`}
        strokeWidth="0.5"
      />
      {/* Radial ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r1 = 30,
          r2 = 36;
        return (
          <line
            key={i}
            x1={40 + Math.cos(a) * r1}
            y1={40 + Math.sin(a) * r1}
            x2={40 + Math.cos(a) * r2}
            y2={40 + Math.sin(a) * r2}
            stroke={`${gold}70`}
            strokeWidth="0.6"
          />
        );
      })}
      {/* Background fill */}
      <circle cx="40" cy="40" r="27" fill={`${curtain}55`} />
      {/* Initials */}
      {i2 ? (
        <>
          <text
            x="28"
            y="46"
            fontFamily="serif"
            fontSize="22"
            fontWeight="300"
            fill={`${gold}CC`}
            textAnchor="middle"
            letterSpacing="1"
          >
            {i1}
          </text>
          <text
            x="52"
            y="46"
            fontFamily="serif"
            fontSize="22"
            fontWeight="300"
            fill={`${gold}CC`}
            textAnchor="middle"
            letterSpacing="1"
          >
            {i2}
          </text>
          <text
            x="40"
            y="44"
            fontFamily="serif"
            fontSize="14"
            fill={`${gold}90`}
            textAnchor="middle"
          >
            &
          </text>
        </>
      ) : (
        <text
          x="40"
          y="48"
          fontFamily="serif"
          fontSize="28"
          fontWeight="300"
          fill={`${gold}CC`}
          textAnchor="middle"
        >
          {i1}
        </text>
      )}
    </svg>
  );
}

export function ParallaxHeroPanel({
  bride = "Taiwo",
  groom,
  tagLine,
  heroPhotoUrl,
  topLabel,
  eventType = "wedding",
}: Props) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState(0); // 0=hidden, 1=monogram, 2=names, 3=full

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const roomCopy: Record<string, string> = {
    wedding: "Navigate to begin the journey →",
    birthday: "Navigate to join the celebration →",
    baby_shower: "Navigate to meet the little one →",
    anniversary: "Navigate to celebrate with us →",
    graduation: "Navigate to share the moment →",
    other: "Navigate to continue →",
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8! gap-6 overflow-hidden"
      style={{
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${heroPhotoUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <GoldDust gold={theme.gold} />

      {/* Top label */}
      <div
        className="flex flex-col items-center gap-4 text-center"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(-12px)",
          transition:
            "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p
          className="font-label font-semibold text-[11px] tracking-[0.7em] uppercase"
          style={{
            color: `${theme.gold}`,
            textShadow: "0 1px 8px rgba(0,0,0,0.9)",
          }}
        >
          {topLabel ?? "Together in Love"}
        </p>

        {/* Monogram cipher */}
        <MonogramCipher
          h1={bride}
          h2={groom ?? ""}
          gold={theme.gold}
          curtain={theme.curtain}
        />
      </div>

      {/* Names — the centrepiece */}
      <div
        className="text-center flex flex-col items-center gap-2"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform:
            phase >= 2
              ? "scale(1) translateY(0)"
              : "scale(0.9) translateY(20px)",
          transition:
            "opacity 0.9s ease 0.1s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}
      >
        <h1
          className="font-display font-light leading-none"
          style={{
            fontSize: "clamp(40px,8vw,80px)",
            color: theme.text,
            letterSpacing: "0.04em",
            textShadow: "0 2px 24px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {bride}
        </h1>

        {groom && groom.trim().length > 0 && (
          <>
            <span
              style={{
                color: theme.gold,
                fontSize: "clamp(20px,4vw,36px)",
                textShadow: `0 0 20px ${theme.gold}60`,
                opacity: 0.85,
              }}
            >
              &
            </span>
            <h1
              className="font-display font-light leading-none"
              style={{
                fontSize: "clamp(40px,8vw,80px)",
                color: theme.text,
                letterSpacing: "0.04em",
                textShadow:
                  "0 2px 24px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {groom}
            </h1>
          </>
        )}
      </div>

      {/* Tagline + prompt */}
      <div
        className="flex flex-col items-center gap-3 text-center"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div
          className="w-20 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}70, transparent)`,
          }}
        />

        {tagLine && (
          <p
            className="font-display italic text-sm"
            style={{
              color: `${theme.text}CC`,
              textShadow: "0 1px 8px rgba(0,0,0,0.9)",
              letterSpacing: "0.08em",
            }}
          >
            {tagLine}
          </p>
        )}

        <p
          className="font-label font-semibold text-[10px] tracking-[0.5em] uppercase"
          style={{
            color: `${theme.gold}85`,
            textShadow: "0 1px 6px rgba(0,0,0,0.8)",
          }}
        >
          {roomCopy[eventType] ?? roomCopy.other}
        </p>
      </div>
    </div>
  );
}
