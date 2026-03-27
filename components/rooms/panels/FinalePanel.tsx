"use client";

import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";
import { formattedDate } from "@/lib/helper";
import { DEMO_EVENT_CONFIG, type EventType } from "@/types/event";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  bride?: string;
  groom?: string;
  finaleTagLine?: string;
  date?: string;
  finaleHeading?: string;
  showCoupleIllustration?: boolean;
  eventType?: EventType;
}

// ── Per-event-type ambient illustration SVG ────────────────────────────────
// Each event type gets a unique silhouette/ornament that fills the room
// with an appropriate mood. All are built from pure SVG paths.

function WeddingIllustration({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      className="w-full max-w-xs opacity-70"
    >
      {/* Altar arch */}
      <path
        d="M40,155 L40,60 Q140,5 240,60 L240,155"
        stroke={`${gold}70`}
        strokeWidth="1.5"
        fill={`${gold}34`}
      />
      {/* Inner arch */}
      <path
        d="M55,155 L55,68 Q140,20 225,68 L225,155"
        stroke={`${gold}55`}
        strokeWidth="0.8"
        fill="none"
        strokeDasharray="5 4"
      />
      {/* Arch roses */}
      {[
        [40, 60],
        [65, 38],
        [95, 22],
        [140, 14],
        [185, 22],
        [215, 38],
        [240, 60],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="5"
            fill={`${curtain}`}
            stroke={`${gold}80`}
            strokeWidth="0.6"
          />
          <circle cx={x} cy={y} r="2" fill={gold} opacity="0.8" />
        </g>
      ))}
      {/* Rings */}
      <circle
        cx="118"
        cy="90"
        r="14"
        fill="none"
        stroke={`${gold}`}
        strokeWidth="2"
      />
      <circle
        cx="162"
        cy="90"
        r="14"
        fill="none"
        stroke={`${gold}`}
        strokeWidth="2"
      />
      <circle
        cx="118"
        cy="90"
        r="10"
        fill="none"
        stroke={`${gold}65`}
        strokeWidth="0.5"
      />
      <circle
        cx="162"
        cy="90"
        r="10"
        fill="none"
        stroke={`${gold}65`}
        strokeWidth="0.5"
      />
      {/* Link */}
      <path
        d="M126,84 Q140,78 154,84 M126,96 Q140,102 154,96"
        stroke={`${gold}75`}
        strokeWidth="1"
        fill="none"
      />
      {/* Scattered petals */}
      {[
        [60, 140],
        [90, 150],
        [120, 155],
        [160, 155],
        [190, 148],
        [220, 138],
      ].map(([px, py], i) => (
        <ellipse
          key={i}
          cx={px}
          cy={py}
          rx="4"
          ry="2.5"
          transform={`rotate(${i * 35},${px},${py})`}
          fill={`${curtain}75`}
          opacity="0.5"
        />
      ))}
      {/* Candles */}
      <rect
        x="70"
        y="120"
        width="6"
        height="28"
        rx="2"
        fill={`${text}42`}
        stroke={`${gold}65`}
        strokeWidth="0.6"
      />
      <ellipse cx="73" cy="119" rx="3" ry="4" fill={gold} opacity="0.9" />
      <rect
        x="204"
        y="120"
        width="6"
        height="28"
        rx="2"
        fill={`${text}42`}
        stroke={`${gold}65`}
        strokeWidth="0.6"
      />
      <ellipse cx="207" cy="119" rx="3" ry="4" fill={gold} opacity="0.9" />
      {/* Light rays */}
      {[100, 120, 140, 160, 180].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1="14"
          x2={140 + i * 3}
          y2="80"
          stroke={gold}
          strokeWidth="0.4"
          opacity="0.08"
        />
      ))}
    </svg>
  );
}

function BirthdayIllustration({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      className="w-full max-w-xs opacity-70"
    >
      {/* Balloon strings */}
      {[
        [70, 40],
        [110, 25],
        [140, 18],
        [170, 25],
        [210, 40],
      ].map(([bx, by], i) => (
        <g key={i}>
          <path
            d={`M${bx},${by + 30} Q${bx + 5},${by + 60} ${bx},${by + 90}`}
            stroke={`${gold}70`}
            strokeWidth="0.8"
            fill="none"
          />
          <ellipse
            cx={bx}
            cy={by}
            rx="14"
            ry="18"
            fill={i % 2 === 0 ? `${curtain}` : `${gold}60`}
            stroke={`${gold}80`}
            strokeWidth="0.8"
          />
          <ellipse
            cx={bx - 4}
            cy={by - 5}
            rx="4"
            ry="3"
            fill="rgba(255,255,255,0.2)"
            transform={`rotate(-30,${bx - 4},${by - 5})`}
          />
        </g>
      ))}
      {/* Party streamers */}
      {[
        [20, 0],
        [80, 0],
        [200, 0],
        [260, 0],
      ].map(([sx, sy], i) => (
        <path
          key={i}
          d={`M${sx},${sy} Q${sx + 20},${sy + 30} ${sx - 10},${sy + 60} Q${sx + 15},${sy + 90} ${sx},${sy + 120}`}
          stroke={i % 2 === 0 ? `${curtain}90` : `${gold}80`}
          strokeWidth="1.2"
          fill="none"
        />
      ))}
      {/* Birthday cake */}
      <rect
        x="108"
        y="110"
        width="64"
        height="38"
        rx="3"
        fill={`${curtain}80`}
        stroke={`${gold}70`}
        strokeWidth="0.8"
      />
      <rect
        x="115"
        y="100"
        width="50"
        height="14"
        rx="2"
        fill={`${curtain}95`}
        stroke={`${gold}80`}
        strokeWidth="0.7"
      />
      <path
        d="M108,110 Q140,105 172,110"
        stroke={`${gold}80`}
        strokeWidth="1"
        fill={`${gold}45`}
      />
      {/* Candles on cake */}
      {[125, 140, 155].map((cx, i) => (
        <g key={i}>
          <rect
            x={cx - 2}
            y="90"
            width="4"
            height="10"
            rx="1"
            fill={i === 1 ? `${gold}` : `${curtain}`}
          />
          <ellipse
            cx={cx}
            cy="89"
            rx="2.5"
            ry="3.5"
            fill={gold}
            opacity="0.9"
          />
          <ellipse
            cx={cx}
            cy="88"
            rx="1.2"
            ry="2"
            fill="#FFF8DC"
            opacity="0.85"
          />
        </g>
      ))}
      {/* Stars */}
      {[
        [35, 25],
        [245, 30],
        [260, 80],
        [20, 100],
        [50, 130],
        [250, 120],
      ].map(([sx, sy], i) => (
        <text
          key={i}
          x={sx}
          y={sy}
          fill={`${gold}${40 + i * 8}`}
          fontSize="10"
          textAnchor="middle"
        >
          ✦
        </text>
      ))}
    </svg>
  );
}

function BabyShowerIllustration({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      className="w-full max-w-xs opacity-70"
    >
      {/* Bunting banner */}
      <path
        d="M20,30 Q70,20 140,25 Q210,20 260,30"
        stroke={`${gold}80`}
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 2"
      />
      {[
        [35, 40],
        [65, 34],
        [95, 30],
        [125, 28],
        [155, 28],
        [185, 30],
        [215, 34],
        [245, 40],
      ].map(([bx, by], i) => (
        <path
          key={i}
          d={`M${bx - 10},${by - 12} L${bx + 10},${by - 12} L${bx},${by + 8} Z`}
          fill={
            i % 3 === 0
              ? `${curtain}90`
              : i % 3 === 1
                ? `${gold}60`
                : `${text}45`
          }
          stroke={`${gold}65`}
          strokeWidth="0.5"
        />
      ))}
      {/* Baby onesie silhouette */}
      <path
        d="M110,70 L100,58 L110,50 L125,60 L140,50 L155,50 L170,58 L160,70 L160,140 L110,140 Z"
        fill={`${curtain}70`}
        stroke={`${gold}70`}
        strokeWidth="0.8"
      />
      {/* Onesie snap buttons */}
      {[125, 135, 145].map((cx, i) => (
        <circle key={i} cx={cx} cy="135" r="2.5" fill={`${gold}90`} />
      ))}
      {/* Baby duck */}
      <ellipse
        cx="60"
        cy="115"
        rx="18"
        ry="14"
        fill={`${gold}65`}
        stroke={`${gold}80`}
        strokeWidth="0.8"
      />
      <ellipse
        cx="70"
        cy="104"
        rx="11"
        ry="9"
        fill={`${gold}75`}
        stroke={`${gold}85`}
        strokeWidth="0.8"
      />
      <path d="M78,106 L84,108 L78,110 Z" fill={`${curtain}`} />
      <circle cx="74" cy="101" r="1.5" fill={`${text}90`} />
      {/* Stars / sparkles */}
      {[
        [200, 80],
        [220, 110],
        [240, 90],
        [30, 90],
        [20, 60],
      ].map(([sx, sy], i) => (
        <text key={i} x={sx} y={sy} fill={`${gold}${50 + i * 7}`} fontSize="12">
          ✦
        </text>
      ))}
    </svg>
  );
}

function GraduationIllustration({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      className="w-full max-w-xs opacity-70"
    >
      {/* Diploma scroll */}
      <rect
        x="70"
        y="55"
        width="140"
        height="90"
        rx="4"
        fill={`${curtain}60`}
        stroke={`${gold}80`}
        strokeWidth="1"
      />
      <rect
        x="65"
        y="55"
        width="12"
        height="90"
        rx="4"
        fill={`${curtain}80`}
        stroke={`${gold}75`}
        strokeWidth="0.8"
      />
      <rect
        x="203"
        y="55"
        width="12"
        height="90"
        rx="4"
        fill={`${curtain}80`}
        stroke={`${gold}75`}
        strokeWidth="0.8"
      />
      {/* Wax seal */}
      <circle
        cx="140"
        cy="100"
        r="18"
        fill={`${curtain}`}
        stroke={`${gold}80`}
        strokeWidth="1"
      />
      <circle
        cx="140"
        cy="100"
        r="13"
        fill="none"
        stroke={`${gold}90`}
        strokeWidth="0.8"
      />
      <text
        x="140"
        y="105"
        fill={`${gold}`}
        fontSize="14"
        textAnchor="middle"
        fontFamily="serif"
      >
        ✦
      </text>
      {/* Lines of text */}
      {[75, 85, 95, 110, 120].map((y, i) => (
        <line
          key={i}
          x1={i === 2 ? 120 : 85}
          y1={y}
          x2={i === 2 ? 160 : 195}
          y2={y}
          stroke={`${gold}65`}
          strokeWidth={i === 2 ? 1 : 0.6}
        />
      ))}
      {/* Mortarboard hat */}
      <rect
        x="108"
        y="22"
        width="64"
        height="10"
        rx="1"
        fill={`${text}70`}
        stroke={`${text}80`}
        strokeWidth="0.7"
      />
      <path
        d="M108,22 L140,10 L172,22 Z"
        fill={`${text}75`}
        stroke={`${text}80`}
        strokeWidth="0.7"
      />
      <circle cx="140" cy="10" r="4" fill={`${text}65`} />
      <path
        d="M155,18 Q162,30 158,42"
        stroke={`${gold}90`}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="158" cy="44" r="3" fill={gold} opacity="0.8" />
      {/* Stars / sparkles */}
      {[
        [30, 40],
        [250, 40],
        [20, 110],
        [260, 110],
        [35, 130],
        [245, 130],
      ].map(([sx, sy], i) => (
        <text
          key={i}
          x={sx}
          y={sy}
          fill={`${gold}${45 + i * 6}`}
          fontSize="10"
          textAnchor="middle"
        >
          ✦
        </text>
      ))}
    </svg>
  );
}

function DefaultIllustration({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      className="w-full max-w-xs opacity-70"
    >
      {/* Starburst */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r1 = 30,
          r2 = 55;
        return (
          <line
            key={i}
            x1={140 + Math.cos(a) * r1}
            y1={80 + Math.sin(a) * r1}
            x2={140 + Math.cos(a) * r2}
            y2={80 + Math.sin(a) * r2}
            stroke={`${gold}${30 + i * 2}`}
            strokeWidth="0.8"
          />
        );
      })}
      {/* Concentric rings */}
      {[28, 42, 56].map((r, i) => (
        <circle
          key={i}
          cx="140"
          cy="80"
          r={r}
          fill="none"
          stroke={`${gold}${40 - i * 8}`}
          strokeWidth="0.7"
        />
      ))}
      {/* Centre star */}
      <circle
        cx="140"
        cy="80"
        r="18"
        fill={`${curtain}80`}
        stroke={`${gold}90`}
        strokeWidth="1"
      />
      <text x="140" y="86" fill={gold} fontSize="18" textAnchor="middle">
        ✦
      </text>
      {/* Orbital dots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={140 + Math.cos(a) * 55}
            cy={80 + Math.sin(a) * 55}
            r="3"
            fill={`${gold}${50 + i * 5}`}
          />
        );
      })}
      {/* Confetti squares */}
      {[
        [40, 20],
        [80, 15],
        [200, 18],
        [240, 22],
        [25, 100],
        [255, 105],
        [50, 140],
        [230, 138],
      ].map(([cx, cy], i) => (
        <rect
          key={i}
          x={cx - 3}
          y={cy - 3}
          width="6"
          height="6"
          rx="1"
          fill={i % 2 === 0 ? `${curtain}90` : `${gold}80`}
          transform={`rotate(${i * 25},${cx},${cy})`}
        />
      ))}
    </svg>
  );
}

// Per event type illustration selector
function EventIllustration({
  eventType,
  gold,
  curtain,
  text,
}: {
  eventType: EventType;
  gold: string;
  curtain: string;
  text: string;
}) {
  switch (eventType) {
    case "wedding":
    case "engagement":
    case "anniversary":
      return <WeddingIllustration gold={gold} curtain={curtain} text={text} />;
    case "birthday":
    case "bridal_shower":
      return <BirthdayIllustration gold={gold} curtain={curtain} text={text} />;
    case "baby_shower":
    case "christening":
      return (
        <BabyShowerIllustration gold={gold} curtain={curtain} text={text} />
      );
    case "graduation":
      return (
        <GraduationIllustration gold={gold} curtain={curtain} text={text} />
      );
    default:
      return <DefaultIllustration gold={gold} curtain={curtain} text={text} />;
  }
}

// ── Ambient light burst — radiates outward on reveal ──────────────────────
function LightBurst({ gold, active }: { gold: string; active: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: 2,
              height: active ? "45%" : "0%",
              background: `linear-gradient(to top, transparent, ${gold}30)`,
              transformOrigin: "bottom center",
              transform: `rotate(${angle}deg) translateY(-50%)`,
              bottom: "50%",
              left: "calc(50% - 1px)",
              transition: `height 1.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Floating gold motes ────────────────────────────────────────────────────
function GoldMotes({ gold, active }: { gold: string; active: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background: gold,
            left: `${5 + ((i * 19) % 90)}%`,
            top: `${10 + ((i * 23) % 80)}%`,
            opacity: active ? 0.25 + (i % 4) * 0.07 : 0,
            transform: active ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 1.2s ease ${i * 0.05}s, transform 1.5s ease ${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FinalePanel({
  bride = "Taiwo",
  groom,
  finaleTagLine,
  date,
  finaleHeading,
  showCoupleIllustration = false,
  eventType = "wedding",
}: Props) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState(0); // 0=dark, 1=light, 2=content, 3=full
  const confettiFiredRef = useRef(false);
  const displayDate = date ?? DEMO_EVENT_CONFIG.date;

  const fireFinaleConfetti = useCallback(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    [0, 500, 1100].forEach((delay) => {
      setTimeout(() => {
        fireConfetti({
          count: 55,
          fixed: true,
          colors: [theme.gold, theme.goldLight, "#ffffff", theme.curtain],
          origin: { x: "50%", y: "50%" },
        });
      }, delay);
    });
  }, [theme]);

  // Staggered entrance phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1200);
    const t4 = setTimeout(fireFinaleConfetti, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [fireFinaleConfetti]);

  // Reset confetti ref when theme changes so it can fire again
  useEffect(() => {
    confettiFiredRef.current = false;
  }, [theme]);

  // ── Vocab-aware tagline defaults per event type ──────────────────────────
  const defaultTaglines: Record<EventType, string> = {
    wedding:
      "Together with our families, we joyfully invite you to witness our union in love.",
    birthday:
      "Thank you for sharing in this celebration — your presence made it unforgettable.",
    baby_shower:
      "Thank you for showering us with so much love as we welcome our little one.",
    christening:
      "Thank you for joining us in this blessed occasion — your presence means everything.",
    bridal_shower:
      "Thank you for celebrating the bride with us — it means the world to her.",
    housewarming:
      "Thank you for helping us make this house a home. We are so grateful.",
    anniversary:
      "Thank you for celebrating our love story with us — here's to many more years.",
    graduation:
      "Thank you for being part of this milestone — your support made it possible.",
    engagement:
      "Thank you for celebrating our love — we can't wait to have you at the wedding.",
    corporate:
      "Thank you for joining us — we look forward to continuing our partnership.",
    other:
      "Thank you for joining us — your presence made this occasion truly special.",
  };

  const taglineText = finaleTagLine ?? defaultTaglines[eventType];

  // ── Emoji ornament per event type ────────────────────────────────────────
  const eventEmoji: Record<EventType, string> = {
    wedding: "💍",
    birthday: "🎂",
    baby_shower: "🍼",
    christening: "✝️",
    bridal_shower: "💐",
    housewarming: "🏡",
    anniversary: "💞",
    graduation: "🎓",
    engagement: "💒",
    corporate: "✦",
    other: "✦",
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6! gap-5 text-center overflow-hidden"
      style={{
        background:
          phase >= 1
            ? `radial-gradient(ellipse 80% 70% at 50% 50%, ${theme.curtain}20 0%, transparent 70%)`
            : "transparent",
        transition: "background 1.2s ease",
      }}
    >
      {/* Ambient light burst rays */}
      <LightBurst gold={theme.gold} active={phase >= 1} />

      {/* Floating gold motes */}
      <GoldMotes gold={theme.gold} active={phase >= 2} />

      {/* ── Event illustration ── */}
      <div
        style={{
          opacity: phase >= 2 ? 0.75 : 0,
          transform:
            phase >= 2
              ? "scale(1) translateY(0)"
              : "scale(0.9) translateY(16px)",
          transition:
            "opacity 1s ease 0.2s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}
      >
        <EventIllustration
          eventType={eventType}
          gold={theme.gold}
          curtain={theme.curtain}
          text={theme.text}
        />
      </div>

      {/* ── Heading block ── */}
      <div
        className="flex flex-col items-center gap-3"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
          transition:
            "opacity 0.9s ease 0.4s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s",
        }}
      >
        {/* Emoji ornament — event-type specific */}
        <div
          style={{
            fontSize: 28,
            filter: `drop-shadow(0 0 12px ${theme.gold}60)`,
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "scale(1)" : "scale(0.5)",
            transition:
              "opacity 0.6s ease 0.6s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.6s",
          }}
        >
          {eventEmoji[eventType]}
        </div>

        {/* Finaleheading — from vocab */}
        <h2
          className="font-display font-light leading-tight"
          style={{
            fontSize: "clamp(22px,4.5vw,42px)",
            color: theme.text,
            letterSpacing: "0.05em",
            textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {finaleHeading}
        </h2>

        {/* Gold rule */}
        <div
          className="h-px"
          style={{
            width: phase >= 3 ? 80 : 0,
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
            transition: "width 1s ease 0.8s",
          }}
        />

        {/* Date */}
        <p
          className="font-label font-semibold text-[12px] tracking-[0.5em] uppercase"
          style={{
            color: `${theme.gold}`,
            textShadow: "0 1px 6px rgba(0,0,0,0.8)",
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.8s ease 0.9s",
          }}
        >
          {formattedDate(displayDate, true)}
        </p>
      </div>

      {/* ── Hosts names ── */}
      {phase >= 3 && (
        <p
          className="font-display italic font-semibold"
          style={{
            fontSize: "clamp(24px,5vw,40px)",
            color: `${theme.gold}95`,
            letterSpacing: "0.3em",
            textShadow: `0 0 20px ${theme.gold}40`,
            animation: "name-glow 0.8s ease forwards",
          }}
        >
          {groom ? `${bride} & ${groom}` : bride}
        </p>
      )}

      {/* ── Tagline ── */}
      <p
        className="font-display italic leading-relaxed max-w-[260px]"
        style={{
          fontSize: "clamp(12px,1.8vw,15px)",
          color: `${theme.text}90`,
          textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.8s ease 1.1s, transform 0.8s ease 1.1s",
        }}
      >
        {taglineText}
      </p>

      {/* ── Ornamental divider at bottom ── */}
      <div
        className="flex items-center gap-2"
        style={{
          opacity: phase >= 3 ? 0.5 : 0,
          transition: "opacity 0.8s ease 1.3s",
        }}
      >
        <div
          className="h-px w-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}60)`,
          }}
        />
        <span
          style={{ color: theme.gold, fontSize: 10, letterSpacing: "0.6em" }}
        >
          ✦ ◆ ✦
        </span>
        <div
          className="h-px w-10"
          style={{
            background: `linear-gradient(90deg, ${theme.gold}60, transparent)`,
          }}
        />
      </div>

      <style>{`
        @keyframes name-glow {
          from { opacity: 0; text-shadow: 0 0 30px ${theme.gold}80; }
          to { opacity: 1; text-shadow: 0 0 20px ${theme.gold}40; }
        }
      `}</style>
    </div>
  );
}
