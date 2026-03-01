"use client";

import { useTheme } from "@/lib/ThemeContext";
import clsx from "clsx";
import gsap from "gsap";
import { useRef, useState } from "react";

interface Props {
  onOpen: () => void;
}

export function DrapedCurtain({ onOpen }: Props) {
  const { theme } = useTheme();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);
  const [opened, setOpened] = useState(false); // resting open state
  const [done, setDone] = useState(false);
  const [shimmer, setShimmer] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setShimmer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);

    gsap
      .timeline({
        onComplete: () => {
          setOpened(true);
          // Brief pause so user sees the open state, then fire onOpen
          gsap.to(
            {},
            {
              duration: 0.9,
              onComplete: () => {
                setDone(true);
                onOpen();
              },
            },
          );
        },
      })
      // Set both panels to start touching at the centre seam
      .set(leftPanelRef.current, { x: "0%" })
      .set(rightPanelRef.current, { x: "0%" })

      // Panels sweep outward – left goes left, right goes right
      // They end up bunched at the sides (about 15% width remaining visible)
      .to(leftPanelRef.current, {
        x: "-100%",
        duration: 2.4,
        ease: "power4.inOut",
      })
      .to(
        rightPanelRef.current,
        {
          x: "100%",
          duration: 2.4,
          ease: "power4.inOut",
        },
        "<",
      );
  };

  if (done) return null;

  // ── Fabric fold strips ─────────────────────────────────────────────────
  const renderFolds = (side: "left" | "right", count: number) =>
    Array.from({ length: count }).map((_, i) => {
      const t = i / (count - 1);
      const phase = side === "left" ? t : 1 - t;
      const bright =
        0.45 + 0.55 * Math.abs(Math.sin(phase * Math.PI * (count / 2)));
      const base = [
        parseInt(theme.curtain.slice(1, 3), 16),
        parseInt(theme.curtain.slice(3, 5), 16),
        parseInt(theme.curtain.slice(5, 7), 16),
      ];
      const [r, g, b] = base.map((c) => Math.round(Math.min(255, c * bright)));
      return (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: `${(i / count) * 100}%`,
            width: `${100 / count}%`,
            backgroundColor: `rgb(${r},${g},${b})`,
          }}
        />
      );
    });

  // ── Swag valance SVG ───────────────────────────────────────────────────
  // Deep theatrical arc like the reference photo
  const SwagValance = () => {
    const W = 1000,
      H = 380;

    // Outer swag shape – deep central dip
    const swag = `M0,0 L0,100 C100,280 300,380 500,310 C700,380 900,280 ${W},100 L${W},0 Z`;

    // Inner highlight crease
    const crease = `M0,60 C120,240 300,340 500,270 C700,340 880,240 ${W},60`;

    // Vertical gathering lines across the swag
    const gatherLines = Array.from({ length: 20 }, (_, i) => {
      const x = (i / 19) * W;
      // Height follows the swag curve
      const mid = W / 2;
      const norm = (x - mid) / mid; // -1 to 1
      const curveY = 310 + 70 * (norm * norm); // parabola bottom
      return { x, y: curveY };
    });

    return (
      <svg
        className="absolute top-0 left-0 w-full pointer-events-none z-20"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ height: "clamp(200px, 32vh, 380px)" }}
      >
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.curtainDark} />
            <stop offset="35%" stopColor={theme.curtain} />
            <stop offset="70%" stopColor={theme.curtainSheen} />
            <stop offset="100%" stopColor={theme.curtainDark} />
          </linearGradient>
          <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={theme.curtainSheen}
              stopOpacity="0.5"
            />
            <stop offset="20%" stopColor={theme.curtain} stopOpacity="0" />
            <stop
              offset="50%"
              stopColor={theme.curtainDark}
              stopOpacity="0.3"
            />
            <stop offset="80%" stopColor={theme.curtain} stopOpacity="0" />
            <stop
              offset="100%"
              stopColor={theme.curtainSheen}
              stopOpacity="0.5"
            />
          </linearGradient>
          <filter id="ds">
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="16"
              floodColor="rgba(0,0,0,0.7)"
            />
          </filter>
        </defs>

        {/* Main swag */}
        <path d={swag} fill="url(#sg)" filter="url(#ds)" />
        {/* Cross-light sheen */}
        <path d={swag} fill="url(#sg2)" />

        {/* Gathering / fold lines */}
        {gatherLines.map((gl, i) => (
          <line
            key={i}
            x1={gl.x}
            y1="0"
            x2={gl.x}
            y2={gl.y * 0.85}
            stroke={i % 2 === 0 ? theme.curtainDark : theme.curtainSheen}
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeOpacity={i % 2 === 0 ? 0.55 : 0.2}
          />
        ))}

        {/* Inner crease highlight */}
        <path
          d={crease}
          stroke={theme.curtainSheen}
          strokeWidth="3"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* Gold top rail */}
        <rect
          x="0"
          y="0"
          width={W}
          height="6"
          fill={theme.gold}
          opacity="0.95"
        />
        <rect
          x="0"
          y="6"
          width={W}
          height="2"
          fill={theme.goldLight}
          opacity="0.5"
        />

        {/* Left swag tassel – where fabric meets side panel */}
        <TasselAt cx={60} cy={90} />
        {/* Right swag tassel */}
        <TasselAt cx={940} cy={90} />
      </svg>
    );
  };

  // Reusable tassel element inside the SVG
  const TasselAt = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r="18" fill={theme.gold} opacity="0.95" />
      <circle cx={cx} cy={cy} r="11" fill={theme.goldLight} opacity="0.8" />
      <circle cx={cx} cy={cy} r="5" fill={theme.curtainDark} opacity="0.6" />
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * 11}
            y1={cy + Math.sin(angle) * 11}
            x2={cx + Math.cos(angle) * 26}
            y2={cy + 44 + Math.sin(angle) * 3}
            stroke={theme.gold}
            strokeWidth="2.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );

  // ── Side tieback ───────────────────────────────────────────────────────
  // In open state: fabric is bunched and tied – rendered on top of bunched panel
  const SideTieback = ({ side }: { side: "left" | "right" }) => (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        [side]: 0,
        top: "44%",
        width: "18%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="70" height="110" viewBox="0 0 70 110" overflow="visible">
        <defs>
          <linearGradient id={`tg-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.curtainDark} />
            <stop offset="50%" stopColor={theme.gold} />
            <stop offset="100%" stopColor={theme.curtainDark} />
          </linearGradient>
        </defs>
        {/* Rope that ties the fabric */}
        {side === "left" ? (
          <path
            d="M70,25 C50,25 15,35 8,55 C2,72 18,80 35,78"
            stroke={`url(#tg-${side})`}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M0,25 C20,25 55,35 62,55 C68,72 52,80 35,78"
            stroke={`url(#tg-${side})`}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Rope highlight */}
        {side === "left" ? (
          <path
            d="M70,30 C52,30 18,39 12,57 C6,72 20,78 35,78"
            stroke={theme.goldLight}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        ) : (
          <path
            d="M0,30 C18,30 52,39 58,57 C64,72 50,78 35,78"
            stroke={theme.goldLight}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        )}
        {/* Tassel ball */}
        <circle cx="35" cy="78" r="12" fill={theme.gold} opacity="0.97" />
        <circle cx="35" cy="78" r="7" fill={theme.goldLight} opacity="0.85" />
        <circle cx="35" cy="78" r="3" fill={theme.curtainDark} opacity="0.5" />
        {/* Tassel fringe strands */}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = 24 + i * 2.2;
          const len = 14 + (i % 3) * 5;
          return (
            <line
              key={i}
              x1={x}
              y1="89"
              x2={x + (i % 2 === 0 ? -0.5 : 0.5)}
              y2={89 + len}
              stroke={theme.gold}
              strokeWidth="2"
              strokeOpacity="0.88"
              strokeLinecap="round"
            />
          );
        })}
        {/* Cap */}
        <ellipse
          cx="35"
          cy="90"
          rx="11"
          ry="3.5"
          fill={theme.curtainDark}
          opacity="0.45"
        />
      </svg>
    </div>
  );

  // ── Open-state bunched panel shape ────────────────────────────────────
  // When the curtain is open, you see the bunched fabric on each side
  // rendered as an SVG shape that looks like gathered fabric at the wall
  const BunchedFabric = ({ side }: { side: "left" | "right" }) => {
    if (!opened) return null;

    const isLeft = side === "left";
    // Shape: wide at top (coming from swag), narrows at tieback, then pools at bottom
    const path = isLeft
      ? "M0,0 L100,0 C80,80 70,160 75,250 C78,300 60,380 30,420 C15,440 0,460 0,480 Z"
      : "M100,0 L0,0 C20,80 30,160 25,250 C22,300 40,380 70,420 C85,440 100,460 100,480 Z";

    const foldPaths = isLeft
      ? [
          "M85,0 C65,90 60,180 65,260 C68,310 50,390 20,430",
          "M60,0 C45,85 40,170 45,245 C48,295 35,375 10,415",
          "M35,0 C25,80 22,155 28,230 C32,278 22,355 5,395",
        ]
      : [
          "M15,0 C35,90 40,180 35,260 C32,310 50,390 80,430",
          "M40,0 C55,85 60,170 55,245 C52,295 65,375 90,415",
          "M65,0 C75,80 78,155 72,230 C68,278 78,355 95,395",
        ];

    return (
      <div
        className="absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{
          [side]: 0,
          width: "18%",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 480"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient
              id={`bf-${side}`}
              x1={isLeft ? "0%" : "100%"}
              y1="0%"
              x2={isLeft ? "100%" : "0%"}
              y2="0%"
            >
              <stop offset="0%" stopColor={theme.curtain} />
              <stop offset="50%" stopColor={theme.curtainSheen} />
              <stop offset="100%" stopColor={theme.curtainDark} />
            </linearGradient>
          </defs>
          <path d={path} fill={`url(#bf-${side})`} />
          {foldPaths.map((fp, i) => (
            <path
              key={i}
              d={fp}
              stroke={i % 2 === 0 ? theme.curtainDark : theme.curtainSheen}
              strokeWidth="2"
              strokeOpacity={i % 2 === 0 ? 0.5 : 0.25}
              fill="none"
            />
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div
      ref={wrapperRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={clsx(
        "fixed inset-0 z-100 overflow-hidden bg-[#050505]",
        clicked ? "cursor-default" : "cursor-pointer",
        done ? "pointer-events-none" : "pointer-events-auto",
      )}
    >
      {/* ── Moving left panel ── */}
      {!opened && (
        <div
          ref={leftPanelRef}
          className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden shadow-[12px_0_50px_rgba(0,0,0,0.9)]"
        >
          <div className="absolute inset-0 flex">{renderFolds("left", 20)}</div>
          <div
            className="absolute top-0 bottom-0 right-0 w-1.5"
            style={{
              background: `linear-gradient(180deg, ${theme.goldLight}, ${theme.gold}, ${theme.goldLight})`,
              boxShadow: `0 0 18px ${theme.gold}`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${100 - shimmer.x * 2}% ${shimmer.y}%, rgba(255,255,255,0.08) 0%, transparent 55%)`,
            }}
          />
          {/* Bottom hem */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
            viewBox="0 0 200 30"
            preserveAspectRatio="none"
            style={{ height: 50 }}
          >
            <path
              d="M0,0 Q60,30 130,15 Q170,5 200,20 L200,30 L0,30Z"
              fill={theme.curtainDark}
              opacity="0.8"
            />
          </svg>
        </div>
      )}

      {/* ── Moving right panel ── */}
      {!opened && (
        <div
          ref={rightPanelRef}
          className="absolute top-0 bottom-0 right-0 overflow-hidden"
          style={{ width: "50%", boxShadow: "-12px 0 50px rgba(0,0,0,0.9)" }}
        >
          <div className="absolute inset-0 flex">
            {renderFolds("right", 20)}
          </div>
          <div
            className="absolute top-0 bottom-0 left-0 w-1.5"
            style={{
              background: `linear-gradient(180deg, ${theme.goldLight}, ${theme.gold}, ${theme.goldLight})`,
              boxShadow: `0 0 18px ${theme.gold}`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${shimmer.x * 2 - 100}% ${shimmer.y}%, rgba(255,255,255,0.08) 0%, transparent 55%)`,
            }}
          />
          <svg
            className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
            viewBox="0 0 200 30"
            preserveAspectRatio="none"
            style={{ height: 50 }}
          >
            <path
              d="M0,20 Q30,5 70,15 Q140,30 200,0 L200,30 L0,30Z"
              fill={theme.curtainDark}
              opacity="0.8"
            />
          </svg>
        </div>
      )}

      {/* ── Open state: bunched fabric at sides + tiebacks ── */}
      {opened && (
        <>
          <BunchedFabric side="left" />
          <BunchedFabric side="right" />
          <SideTieback side="left" />
          <SideTieback side="right" />
        </>
      )}

      {/* ── Swag valance – always present ── */}
      <SwagValance />

      {/* ── CTA ── */}
      {!clicked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30"
          style={{ paddingTop: "clamp(200px, 33vh, 380px)" }}
        >
          <p
            className="font-display animate-pulse-soft text-center"
            style={{
              fontSize: "clamp(28px,5vw,56px)",
              color: theme.gold,
              textShadow: `0 0 40px ${theme.gold}80, 0 2px 4px rgba(0,0,0,0.9)`,
              letterSpacing: "0.15em",
            }}
          >
            You Are Invited
          </p>
          <p
            className="font-label uppercase"
            style={{
              fontSize: "clamp(11px,1.5vw,16px)",
              color: `${theme.gold}90`,
              letterSpacing: "0.45em",
            }}
          >
            Click to Enter
          </p>
          <span style={{ color: theme.gold, fontSize: 28, opacity: 0.65 }}>
            ❧
          </span>
        </div>
      )}

      {clicked && !done && !opened && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{ paddingTop: "clamp(200px, 33vh, 380px)" }}
        >
          <p
            className="font-display"
            style={{
              fontSize: "clamp(22px,4vw,42px)",
              color: theme.gold,
              textShadow: `0 0 40px ${theme.gold}80`,
              letterSpacing: "0.15em",
            }}
          >
            Opening…
          </p>
        </div>
      )}

      {/* When fully open – brief moment showing the open curtain state */}
      {opened && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 animate-fade-up"
          style={{ paddingTop: "clamp(200px, 33vh, 380px)" }}
        >
          <p
            className="font-display text-center"
            style={{
              fontSize: "clamp(22px,4vw,42px)",
              color: theme.gold,
              textShadow: `0 0 40px ${theme.gold}80`,
              letterSpacing: "0.15em",
              opacity: 0.85,
            }}
          >
            Welcome
          </p>
        </div>
      )}
    </div>
  );
}
