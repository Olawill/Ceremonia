"use client";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";

import { formattedDate } from "@/lib/helper";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

gsap.registerPlugin(ScrollTrigger);

interface FinaleProps {
  bride?: string;
  groom?: string;
  finaleTagLine?: string;
  date?: string;
}

function BrideGroomSVG({
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
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-xs mx-auto"
    >
      {/* ── Altar arch ── */}
      <path
        d="M60,280 L60,100 Q170,20 280,100 L280,280"
        stroke={`${gold}50`}
        strokeWidth="2"
        fill={`${gold}04`}
      />
      {/* Inner arch */}
      <path
        d="M75,280 L75,108 Q170,38 265,108 L265,280"
        stroke={`${gold}30`}
        strokeWidth="1"
        fill="none"
        strokeDasharray="5 4"
      />
      {/* Arch decoration – roses */}
      {[
        [60, 100],
        [80, 72],
        [110, 50],
        [140, 36],
        [170, 30],
        [200, 36],
        [230, 50],
        [260, 72],
        [280, 100],
      ].map(([ax, ay], i) => (
        <g key={i}>
          <circle
            cx={ax}
            cy={ay}
            r="5"
            fill={`${curtain}70`}
            stroke={`${gold}50`}
            strokeWidth="0.6"
          />
          <circle cx={ax} cy={ay} r="2.5" fill={gold} opacity="0.7" />
        </g>
      ))}
      {/* Hanging greenery */}
      <path
        d="M80,72 Q72,90 68,110"
        stroke={`${text}25`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M260,72 Q268,90 272,110"
        stroke={`${text}25`}
        strokeWidth="1.5"
        fill="none"
      />

      {/* ── Altar step ── */}
      <rect
        x="100"
        y="272"
        width="140"
        height="8"
        rx="2"
        fill={`${gold}25`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <rect
        x="90"
        y="278"
        width="160"
        height="8"
        rx="2"
        fill={`${gold}18`}
        stroke={`${gold}30`}
        strokeWidth="0.6"
      />
      {/* Candles on altar */}
      <rect
        x="106"
        y="250"
        width="6"
        height="22"
        rx="2"
        fill={`${text}15`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <ellipse cx="109" cy="249" rx="3" ry="4.5" fill={gold} opacity="0.9" />
      <ellipse
        cx="109"
        cy="247"
        rx="1.8"
        ry="3"
        fill="#FFF8DC"
        opacity="0.85"
      />
      <ellipse cx="109" cy="249" rx="10" ry="10" fill={`${gold}12`} />
      <rect
        x="228"
        y="250"
        width="6"
        height="22"
        rx="2"
        fill={`${text}15`}
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      <ellipse cx="231" cy="249" rx="3" ry="4.5" fill={gold} opacity="0.9" />
      <ellipse
        cx="231"
        cy="247"
        rx="1.8"
        ry="3"
        fill="#FFF8DC"
        opacity="0.85"
      />
      <ellipse cx="231" cy="249" rx="10" ry="10" fill={`${gold}12`} />

      {/* ── GROOM ── */}
      {/* Legs / trousers */}
      <rect
        x="153"
        y="230"
        width="10"
        height="42"
        rx="3"
        fill={`${text}18`}
        stroke={`${text}25`}
        strokeWidth="0.5"
      />
      <rect
        x="165"
        y="230"
        width="10"
        height="42"
        rx="3"
        fill={`${text}18`}
        stroke={`${text}25`}
        strokeWidth="0.5"
      />
      {/* Shoes */}
      <ellipse cx="158" cy="273" rx="7" ry="3" fill={`${text}20`} />
      <ellipse cx="170" cy="273" rx="7" ry="3" fill={`${text}20`} />
      {/* Jacket body */}
      <path
        d="M148,190 L148,232 L180,232 L180,190 Q170,185 164,184 Q158,185 148,190Z"
        fill={`${text}20`}
        stroke={`${text}30`}
        strokeWidth="0.6"
      />
      {/* White shirt / waistcoat */}
      <path
        d="M158,190 L158,230 L170,230 L170,190 Q166,187 164,187 Q162,187 158,190Z"
        fill={`${text}35`}
      />
      {/* Lapels */}
      <path
        d="M148,192 L158,200 L164,192"
        stroke={`${text}30`}
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M180,192 L170,200 L164,192"
        stroke={`${text}30`}
        strokeWidth="0.8"
        fill="none"
      />
      {/* Bow tie */}
      <path d="M161,196 L164,199 L167,196 L164,193Z" fill={`${curtain}80`} />
      {/* Boutonniere */}
      <circle
        cx="153"
        cy="205"
        r="3.5"
        fill={`${curtain}70`}
        stroke={`${gold}60`}
        strokeWidth="0.6"
      />
      <circle cx="153" cy="205" r="1.5" fill={gold} opacity="0.7" />
      {/* Arms – turned toward bride */}
      <path
        d="M148,200 Q138,215 140,232"
        stroke={`${text}20`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M180,200 Q186,218 182,232"
        stroke={`${text}20`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right hand extended toward bride */}
      <ellipse cx="140" cy="233" rx="5" ry="3.5" fill={`${text}35`} />
      {/* Neck */}
      <rect x="161" y="177" width="6" height="13" rx="2" fill={`${text}40`} />
      {/* Head */}
      <circle
        cx="164"
        cy="168"
        r="16"
        fill={`${text}40`}
        stroke={`${text}30`}
        strokeWidth="0.5"
      />
      {/* Hair */}
      <path
        d="M149,162 Q152,152 164,152 Q176,152 179,162"
        fill={`${text}25`}
        stroke="none"
      />
      {/* Face details */}
      <ellipse
        cx="159"
        cy="167"
        rx="2"
        ry="2.5"
        fill={`${text}20`}
        opacity="0.5"
      />
      <ellipse
        cx="169"
        cy="167"
        rx="2"
        ry="2.5"
        fill={`${text}20`}
        opacity="0.5"
      />
      <path
        d="M160,174 Q164,177 168,174"
        stroke={`${text}25`}
        strokeWidth="1"
        fill="none"
      />
      {/* Top hat */}
      <rect
        x="155"
        y="148"
        width="18"
        height="14"
        rx="1"
        fill={`${text}22`}
        stroke={`${text}30`}
        strokeWidth="0.7"
      />
      <rect
        x="150"
        y="160"
        width="28"
        height="3"
        rx="1"
        fill={`${text}22`}
        stroke={`${text}30`}
        strokeWidth="0.6"
      />
      {/* Hat band */}
      <rect x="155" y="155" width="18" height="2" fill={`${curtain}60`} />

      {/* ── BRIDE ── */}
      {/* Dress skirt – full ballgown */}
      <path
        d="M182,232 Q178,238 170,258 Q160,278 158,290 L210,290 Q208,278 198,258 Q190,238 186,232Z"
        fill={`${text}22`}
        stroke={`${gold}35`}
        strokeWidth="0.7"
      />
      {/* Dress skirt layers */}
      <path
        d="M183,245 Q178,255 172,270 Q164,282 162,290 L162,290"
        stroke={`${gold}25`}
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M185,250 Q182,263 178,278 Q173,286 170,290"
        stroke={`${gold}20`}
        strokeWidth="0.5"
        fill="none"
      />
      {/* Dress bodice */}
      <path
        d="M178,190 L178,233 L196,233 L196,190 Q190,184 187,183 Q184,184 178,190Z"
        fill={`${text}28`}
        stroke={`${gold}30`}
        strokeWidth="0.7"
      />
      {/* Lace detail on bodice */}
      <path
        d="M179,195 Q187,192 195,195"
        stroke={`${gold}35`}
        strokeWidth="0.6"
        fill="none"
      />
      <path
        d="M179,200 Q187,197 195,200"
        stroke={`${gold}30`}
        strokeWidth="0.5"
        fill="none"
      />
      {/* Sweetheart neckline */}
      <path
        d="M180,190 Q187,196 187,192 Q187,196 194,190"
        stroke={`${gold}40`}
        strokeWidth="0.8"
        fill="none"
      />
      {/* Arms – one toward groom, one holding bouquet */}
      <path
        d="M196,200 Q205,215 202,232"
        stroke={`${text}25`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M178,200 Q170,218 173,232"
        stroke={`${text}25`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hand toward groom */}
      <ellipse cx="202" cy="233" rx="5" ry="3.5" fill={`${text}40`} />
      {/* Holding hands connection */}
      <path
        d="M140,233 Q171,240 202,233"
        stroke={`${gold}40`}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="3 2"
      />
      {/* Bouquet */}
      <circle
        cx="172"
        cy="237"
        r="12"
        fill={`${curtain}50`}
        stroke={`${gold}40`}
        strokeWidth="0.8"
      />
      <circle
        cx="168"
        cy="234"
        r="5"
        fill={`${curtain}75`}
        stroke={`${gold}50`}
        strokeWidth="0.5"
      />
      <circle
        cx="176"
        cy="233"
        r="5"
        fill={`${curtain}80`}
        stroke={`${gold}55`}
        strokeWidth="0.5"
      />
      <circle
        cx="172"
        cy="230"
        r="5"
        fill={`${curtain}70`}
        stroke={`${gold}45`}
        strokeWidth="0.5"
      />
      <circle cx="168" cy="234" r="2" fill={gold} opacity="0.7" />
      <circle cx="176" cy="233" r="2" fill={gold} opacity="0.7" />
      <circle cx="172" cy="230" r="2" fill={gold} opacity="0.7" />
      {/* Bouquet ribbon */}
      <path
        d="M168,248 Q172,252 176,248"
        stroke={`${gold}60`}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Neck */}
      <rect x="184" y="177" width="6" height="13" rx="2" fill={`${text}45`} />
      {/* Head */}
      <circle
        cx="187"
        cy="167"
        r="16"
        fill={`${text}45`}
        stroke={`${text}35`}
        strokeWidth="0.5"
      />
      {/* Hair – up-do */}
      <path d="M172,160 Q175,148 187,147 Q199,148 202,160" fill={`${text}28`} />
      <ellipse cx="187" cy="148" rx="9" ry="6" fill={`${text}28`} />
      {/* Bun */}
      <circle
        cx="187"
        cy="143"
        r="7"
        fill={`${text}28`}
        stroke={`${gold}30`}
        strokeWidth="0.5"
      />
      {/* Face */}
      <ellipse
        cx="182"
        cy="167"
        rx="2"
        ry="2.5"
        fill={`${text}30`}
        opacity="0.45"
      />
      <ellipse
        cx="192"
        cy="167"
        rx="2"
        ry="2.5"
        fill={`${text}30`}
        opacity="0.45"
      />
      <path
        d="M183,174 Q187,178 191,174"
        stroke={`${text}30`}
        strokeWidth="1"
        fill="none"
      />
      {/* Veil */}
      <path
        d="M179,150 Q165,175 162,210 Q160,240 165,270"
        stroke={`${text}18`}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4 3"
      />
      {/* Tiara */}
      <path
        d="M179,149 Q183,142 187,140 Q191,142 195,149"
        stroke={`${gold}70`}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="187" cy="140" r="2.5" fill={gold} opacity="0.9" />
      <circle cx="182" cy="144" r="1.8" fill={gold} opacity="0.75" />
      <circle cx="192" cy="144" r="1.8" fill={gold} opacity="0.75" />

      {/* ── Officiant (simple silhouette) ── */}
      <circle cx="250" cy="185" r="10" fill={`${text}18`} />
      <rect x="244" y="195" width="12" height="30" rx="3" fill={`${text}18`} />
      {/* Book */}
      <rect
        x="240"
        y="210"
        width="20"
        height="14"
        rx="2"
        fill={`${text}25`}
        stroke={`${gold}35`}
        strokeWidth="0.7"
      />
      <line
        x1="250"
        y1="211"
        x2="250"
        y2="223"
        stroke={`${gold}25`}
        strokeWidth="0.5"
      />

      {/* ── Scattered rose petals on floor ── */}
      {[
        [120, 285],
        [135, 290],
        [155, 295],
        [170, 298],
        [190, 298],
        [210, 296],
        [225, 292],
        [240, 286],
      ].map(([px, py], i) => (
        <ellipse
          key={i}
          cx={px}
          cy={py}
          rx="3.5"
          ry="2"
          transform={`rotate(${i * 40}, ${px}, ${py})`}
          fill={`${curtain}45`}
          opacity="0.6"
        />
      ))}

      {/* ── Gold light rays from above ── */}
      {[150, 170, 190, 210].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1="28"
          x2={170 + i * 2}
          y2="180"
          stroke={gold}
          strokeWidth="0.5"
          strokeOpacity="0.08"
        />
      ))}
    </svg>
  );
}

export function Finale({
  bride = "Taiwo",
  groom = "Tayo",
  finaleTagLine,
  date,
}: FinaleProps) {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const displayDate = date ?? DEMO_WEDDING_CONFIG.date;

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    gsap.set(contentRef.current, { opacity: 0, scale: 0.88 });

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      scroller: "[data-scroll-container]",
      start: "top 55%",
      once: true,
      onEnter: () => {
        gsap.to(contentRef.current, {
          opacity: 1,
          scale: 1,
          duration: 1.3,
          ease: "power3.out",
        });

        // Three waves of confetti
        [0, 600, 1200].forEach((delay) => {
          setTimeout(() => {
            fireConfetti({
              count: 60,
              fixed: true,
              colors: [theme.gold, theme.goldLight, "#ffffff", theme.curtain],
              origin: { x: "50%", y: "50%" },
            });
          }, delay);
        });
      },
    });

    return () => st.kill();
  }, [theme]);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center text-center px-6! py-20! relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at center, ${theme.curtain}28 0%, ${theme.bg} 70%)`,
      }}
    >
      {/* Background ornament rings */}
      <div
        className="absolute rounded-full pointer-events-none opacity-5"
        style={{
          width: 600,
          height: 600,
          border: `1px solid ${theme.gold}`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none opacity-5"
        style={{
          width: 400,
          height: 400,
          border: `1px solid ${theme.gold}`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div ref={contentRef} className="relative z-10 space-y-6!">
        {/* Bride & Groom SVG */}
        <div className="py-4">
          <BrideGroomSVG
            gold={theme.gold}
            curtain={theme.curtain}
            text={theme.text}
          />
        </div>

        <p
          className="font-display italic font-bold"
          style={{
            fontSize: "clamp(16px,3.5vw,26px)",
            color: `${theme.gold}75`,
            letterSpacing: "0.4em",
          }}
        >
          {bride} &amp; {groom}
        </p>

        <div style={{ color: theme.gold, fontSize: 28 }}>✦ ◆ ✦</div>

        <h2
          className="font-display font-light leading-tight"
          style={{
            fontSize: "clamp(36px,8vw,90px)",
            color: theme.text,
            letterSpacing: "0.04em",
          }}
        >
          See You at
          <br />
          The Altar
        </h2>

        <div
          className="w-28 h-px mx-auto"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />

        <p
          className="font-label tracking-[0.4em] text-sm font-semibold"
          style={{ color: `${theme.gold}85`, marginTop: "16px" }}
        >
          {formattedDate(displayDate, true)}
        </p>

        <p
          className="font-display italic leading-relaxed max-w-sm mx-auto font-semibold"
          style={{ color: `${theme.text}55`, fontSize: "clamp(18px,2vw,22px)" }}
        >
          {finaleTagLine ?? (
            <>
              Together with our families,
              <br />
              we joyfully invite you to witness
              <br />
              our union in love.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
