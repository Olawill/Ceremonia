"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { EventType } from "@/types/event";
import { getVocabulary } from "@/types/event";

interface EnvelopeCurtainProps {
  onOpen: () => void;
  host1: string;
  host2?: string;
  eventType?: EventType;
}

function getEnvelopeCopy(eventType: EventType = "wedding") {
  const map: Record<EventType, { greeting: string; subline: string }> = {
    wedding: {
      greeting: "You are cordially invited",
      subline: "to witness our union",
    },
    birthday: {
      greeting: "You are invited to celebrate",
      subline: "a very special birthday",
    },
    baby_shower: {
      greeting: "You are invited to join us",
      subline: "as we welcome a new arrival",
    },
    christening: {
      greeting: "You are warmly invited",
      subline: "to share in this blessing",
    },
    bridal_shower: {
      greeting: "You are invited to celebrate",
      subline: "the bride-to-be",
    },
    housewarming: {
      greeting: "You are invited to celebrate",
      subline: "our new home",
    },
    anniversary: {
      greeting: "You are invited to celebrate",
      subline: "years of love",
    },
    graduation: {
      greeting: "You are invited to celebrate",
      subline: "this achievement",
    },
    engagement: {
      greeting: "You are invited to celebrate",
      subline: "our engagement",
    },
    corporate: { greeting: "You are cordially invited", subline: "to join us" },
    other: { greeting: "You are invited", subline: "to a special occasion" },
  };
  return map[eventType] ?? map.wedding;
}

export function EnvelopeCurtain({
  onOpen,
  host1,
  host2,
  eventType = "wedding",
}: EnvelopeCurtainProps) {
  const { theme } = useTheme();
  const vocab = getVocabulary(eventType);
  const copy = getEnvelopeCopy(eventType);

  const [done, setDone] = useState(false);
  const [clicked, setClicked] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null); // idle float target
  const flapRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const initials =
    `${host1?.[0] ?? ""}${host2?.[0] ?? ""}`.toUpperCase() || "✦";

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setDone(true);
        onOpen();
      },
    });

    // 1. Flap swings open — rotates backward on its bottom hinge
    tl.to(flapRef.current, {
      rotateX: -175,
      duration: 1.05,
      ease: "power2.inOut",
    });

    // 2. Letter becomes visible and rises out of the envelope body
    //    Starts opacity 0, translateY 0 (hidden inside) → opacity 1, translateY upward
    tl.set(letterRef.current, { opacity: 1, zIndex: 9999 }, "-=0.1");
    tl.to(
      letterRef.current,
      { y: "-115%", duration: 1.0, ease: "power3.out" },
      "<",
    );

    // 3. Scene fades out
    tl.to(
      wrapperRef.current,
      { opacity: 0, scale: 0.93, duration: 0.5, ease: "power2.in" },
      "+=2.2",
    );
  };

  // Idle float on the whole envelope group
  useEffect(() => {
    if (clicked) return;
    const ctx = gsap.context(() => {
      gsap.to(floatRef.current, {
        y: -10,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, [clicked]);

  // ── Envelope dimensions — used by both the SVG and the absolute-positioned layers ──
  const W = 540;
  const H = 360;
  const FLAP_PEAK_Y = H * 0.5; // V-point of the flap, halfway down the envelope

  if (done) return null;

  return (
    <div
      ref={wrapperRef}
      onClick={handleClick}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center"
      style={{
        background: `radial-gradient(ellipse at center, ${theme.bgMid} 0%, ${theme.bg} 70%)`,
        cursor: clicked ? "default" : "pointer",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 58%, ${theme.gold}12 0%, transparent 70%)`,
        }}
      />

      {/* Tap prompt */}
      {!clicked && (
        <p
          className="font-label text-[11px] tracking-[0.55em] uppercase pointer-events-none mb-6!"
          style={{ color: theme.gold + "80" }}
        >
          Tap to open
        </p>
      )}

      {/* Float container */}
      <div ref={floatRef} className="flex flex-col items-center">
        {/*
          ════════════════════════════════════════════════════════
          ENVELOPE SCENE
          The envelope is a fixed-size box. Inside it:
            • Envelope body  (absolute, fills the box)
            • Letter         (absolute, bottom-anchored, opacity 0 at start)
            • Flap           (absolute, top-anchored, hinges at its OWN bottom)
              └─ Wax seal    (child of flap, sits at flap's bottom edge)

          The perspective is on the SCENE wrapper so the flap's
          rotateX works correctly without distorting other layers.
          ════════════════════════════════════════════════════════
        */}
        <div
          className="relative"
          style={{
            width: "min(540px, 90vw)",
            height: "min(360px, 67vw)",
            // Perspective must be on this element for the flap rotation to look right
            perspective: "1100px",
            perspectiveOrigin: "50% 0%",
          }}
        >
          {/* ── Unified envelope SVG: body + crease lines + flap ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ borderRadius: 16 }}
          >
            <defs>
              {/* Envelope body gradient */}
              <linearGradient id="env-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={theme.curtainSheen}
                  stopOpacity="0.75"
                />
                <stop offset="45%" stopColor={theme.curtain} />
                <stop offset="100%" stopColor={theme.curtainDark} />
              </linearGradient>

              {/* Flap gradient — slightly lighter at top to distinguish from body */}
              <linearGradient id="env-flap" x1="0%" y1="0%" x2="60%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={theme.curtainSheen}
                  stopOpacity="0.85"
                />
                <stop offset="55%" stopColor={theme.curtain} />
                <stop offset="100%" stopColor={theme.curtainDark} />
              </linearGradient>

              {/* Flap sheen overlay */}
              <linearGradient
                id="env-flap-sheen"
                x1="0%"
                y1="0%"
                x2="80%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={theme.curtainSheen}
                  stopOpacity="0.45"
                />
                <stop
                  offset="60%"
                  stopColor={theme.curtainSheen}
                  stopOpacity="0"
                />
              </linearGradient>

              {/* Drop shadow for the whole envelope */}
              <filter
                id="env-shadow"
                x="-10%"
                y="-10%"
                width="120%"
                height="130%"
              >
                <feDropShadow
                  dx="0"
                  dy="28"
                  stdDeviation="28"
                  floodColor="rgba(0,0,0,0.75)"
                />
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="20"
                  floodColor={theme.gold}
                  floodOpacity="0.06"
                />
              </filter>

              {/* Soft inner shadow along the flap fold line */}
              <filter
                id="fold-shadow"
                x="-5%"
                y="-20%"
                width="110%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="6"
                  floodColor="rgba(0,0,0,0.5)"
                />
              </filter>

              {/* Clip the body rectangle so rounded corners apply */}
              <clipPath id="env-clip">
                <rect x="0" y="0" width={W} height={H} rx="16" ry="16" />
              </clipPath>
            </defs>

            {/* ── Body rectangle ── */}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              rx="16"
              ry="16"
              fill="url(#env-body)"
              filter="url(#env-shadow)"
            />

            {/* ── Body crease lines (clipped to body) ── */}
            <g clipPath="url(#env-clip)">
              {/* Bottom V-fold crease */}
              <path
                d={`M0,${H} L${W / 2},${H * 0.48} L${W},${H}`}
                fill="none"
                stroke={theme.gold}
                strokeOpacity="0.18"
                strokeWidth="1"
              />
              {/* Left diagonal */}
              <path
                d={`M0,0 L${W / 2},${H * 0.48}`}
                fill="none"
                stroke={theme.gold}
                strokeOpacity="0.14"
                strokeWidth="1"
              />
              {/* Right diagonal */}
              <path
                d={`M${W},0 L${W / 2},${H * 0.48}`}
                fill="none"
                stroke={theme.gold}
                strokeOpacity="0.14"
                strokeWidth="1"
              />
              {/* Inner border */}
              <rect
                x="8"
                y="8"
                width={W - 16}
                height={H - 16}
                rx="10"
                ry="10"
                fill="none"
                stroke={theme.gold}
                strokeOpacity="0.1"
                strokeWidth="1"
              />
            </g>
          </svg>

          {/* ── Wax seal — sits on the flap fold line, on top of everything ── */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              width: 80,
              height: 80,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg viewBox="0 0 76 76" width="80" height="80">
              <defs>
                <radialGradient id="wax-fill" cx="38%" cy="32%" r="60%">
                  <stop offset="0%" stopColor={theme.goldLight} />
                  <stop offset="40%" stopColor={theme.gold} />
                  <stop offset="100%" stopColor={theme.curtainDark} />
                </radialGradient>
                <radialGradient id="wax-shine" cx="35%" cy="28%" r="45%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter
                  id="wax-shadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="4"
                    floodColor="rgba(0,0,0,0.6)"
                  />
                </filter>
              </defs>

              {/* Irregular wax blob */}
              <path
                d="M38,4 C41,4 44,8 47,7 C50,6 51,2 54,4 C57,6 56,10 59,12 C62,14 66,12 68,15 C70,18 67,22 69,25 C71,28 75,28 75,32 C75,36 71,37 71,41 C71,45 74,48 72,51 C70,54 66,53 64,56 C62,59 63,63 60,65 C57,67 54,64 51,66 C48,68 47,72 44,73 C41,74 39,71 36,71 C33,71 31,74 28,73 C25,72 24,68 21,66 C18,64 15,67 12,65 C9,63 10,59 8,56 C6,53 2,54 1,51 C-1,48 3,45 3,41 C3,37 -1,36 -1,32 C-1,28 3,28 5,25 C7,22 4,18 6,15 C8,12 12,14 15,12 C18,10 17,6 20,4 C23,2 24,6 27,7 C30,8 33,4 38,4 Z"
                fill="url(#wax-fill)"
                filter="url(#wax-shadow)"
              />
              {/* Specular shine */}
              <path
                d="M38,4 C41,4 44,8 47,7 C50,6 51,2 54,4 C57,6 56,10 59,12 C62,14 66,12 68,15 C70,18 67,22 69,25 C71,28 75,28 75,32 C75,36 71,37 71,41 C71,45 74,48 72,51 C70,54 66,53 64,56 C62,59 63,63 60,65 C57,67 54,64 51,66 C48,68 47,72 44,73 C41,74 39,71 36,71 C33,71 31,74 28,73 C25,72 24,68 21,66 C18,64 15,67 12,65 C9,63 10,59 8,56 C6,53 2,54 1,51 C-1,48 3,45 3,41 C3,37 -1,36 -1,32 C-1,28 3,28 5,25 C7,22 4,18 6,15 C8,12 12,14 15,12 C18,10 17,6 20,4 C23,2 24,6 27,7 C30,8 33,4 38,4 Z"
                fill="url(#wax-shine)"
              />
              {/* Embossed ring */}
              <circle
                cx="38"
                cy="38"
                r="21"
                fill="none"
                stroke={theme.curtainDark}
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <circle
                cx="38"
                cy="38"
                r="18"
                fill="none"
                stroke={theme.curtainDark}
                strokeWidth="0.75"
                strokeOpacity="0.25"
              />
              {/* Initials */}
              <text
                x="38"
                y="44"
                textAnchor="middle"
                fontFamily="'Cormorant Garamond', serif"
                fontWeight="700"
                fontSize={initials.length > 2 ? "13" : "16"}
                fill={theme.curtainDark}
                fillOpacity="0.85"
                letterSpacing="1"
              >
                {initials}
              </text>
            </svg>
          </div>

          {/* ── Flap — HTML div so GSAP rotateX works reliably ── */}
          <div
            ref={flapRef}
            className="absolute left-0 right-0 top-0 pointer-events-none overflow-hidden"
            style={{
              height: `${FLAP_PEAK_Y}px`,
              // Hinge is at the BOTTOM of this div — the fold line
              transformOrigin: "top center",
              transformStyle: "preserve-3d",
              zIndex: 13,
              // Clip to the envelope's rounded corners at top
              borderRadius: "16px 16px 0 0",
            }}
          >
            {/* Flap triangle fill */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(175deg, ${theme.curtainSheen}BB 0%, ${theme.curtain} 55%, ${theme.curtainDark} 100%)`,
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
            />
            {/* Sheen overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(140deg, ${theme.curtainSheen}55 0%, transparent 50%)`,
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              }}
            />
            {/* Fold crease line at the bottom of the flap */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${theme.gold}40, transparent)`,
              }}
            />
          </div>

          {/* ── Letter ──
              Starts: opacity 0, y 0 (hidden inside envelope body)
              Opens:  opacity 1, y -115% (floats above envelope)
              Bottom edge is anchored to the bottom of the envelope.
          ── */}
          <div
            ref={letterRef}
            className="absolute pointer-events-none"
            style={{
              bottom: 0,
              left: "6%",
              right: "6%",
              // Tall enough that when y=-115% the full letter is visible above
              height: "85%",
              borderRadius: "12px 12px 0 0",
              background: "linear-gradient(170deg, #FDFAF3 0%, #F5EED8 100%)",
              boxShadow:
                "0 -8px 32px rgba(0,0,0,0.45), 0 -2px 8px rgba(0,0,0,0.2)",
              // HIDDEN until the flap has opened
              opacity: 0,
              zIndex: 5,
            }}
          >
            {/* Ruled lines texture */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ opacity: 0.15 }}
            >
              {[18, 28, 38, 48, 58, 68, 78, 88].map((y) => (
                <line
                  key={y}
                  x1="8"
                  y1={y}
                  x2="92"
                  y2={y}
                  stroke="#8B7355"
                  strokeWidth="0.5"
                />
              ))}
            </svg>

            {/* Letter text content */}
            <div className="flex flex-col items-center justify-center h-full gap-4 px-10 pb-6 text-center">
              <p
                className="font-display tracking-[0.38em] uppercase"
                style={{
                  color: "#5C4A2A",
                  fontSize: "clamp(9px, 1.5vw, 12px)",
                  opacity: 0.65,
                }}
              >
                {copy.greeting}
              </p>

              <p
                className="font-display italic leading-tight"
                style={{
                  color: "#2C1810",
                  fontSize: "clamp(26px, 4.8vw, 40px)",
                  letterSpacing: "0.02em",
                }}
              >
                {host1}
                {host2 ? ` & ${host2}` : ""}
              </p>

              {/* Ornamental divider */}
              <div className="flex items-center gap-3">
                <div
                  className="h-px w-10"
                  style={{ background: "#8B735560" }}
                />
                <span style={{ color: "#8B7355", fontSize: 14, opacity: 0.6 }}>
                  ✦
                </span>
                <div
                  className="h-px w-10"
                  style={{ background: "#8B735560" }}
                />
              </div>

              <p
                className="font-display tracking-[0.28em] uppercase"
                style={{
                  color: "#5C4A2A",
                  fontSize: "clamp(8px, 1.3vw, 11px)",
                  opacity: 0.55,
                }}
              >
                {copy.subline}
              </p>
            </div>
          </div>
        </div>
        {/* end envelope scene */}

        {/* ── Name ribbon below the envelope ── */}
        <div
          className="flex items-center gap-3 mt-7"
          style={{
            opacity: clicked ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        >
          <div className="h-px w-8" style={{ background: theme.gold + "40" }} />
          <p
            className="font-label tracking-[0.45em] uppercase"
            style={{
              color: theme.gold + "70",
              fontSize: "clamp(10px, 1.4vw, 12px)",
            }}
          >
            {host1}
            {host2 ? ` · ${host2}` : ""}
          </p>
          <div className="h-px w-8" style={{ background: theme.gold + "40" }} />
        </div>
      </div>
      {/* end float container */}
    </div>
  );
}
