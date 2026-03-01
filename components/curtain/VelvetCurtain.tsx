"use client";

import { useTheme } from "@/lib/ThemeContext";
import clsx from "clsx";
import gsap from "gsap";
import { useRef, useState } from "react";

interface Props {
  onOpen: () => void;
}

const FOLD_COUNT = 8;

export function VelvetCurtain({ onOpen }: Props) {
  const { theme } = useTheme();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);
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

    const tl = gsap.timeline({
      onComplete: () => {
        setDone(true);
        onOpen();
      },
    });

    tl.to(leftRef.current, {
      x: "-100%",
      duration: 2.2,
      ease: "power4.inOut",
      delay: 0.3,
    }).to(
      rightRef.current,
      { x: "100%", duration: 2.2, ease: "power4.inOut" },
      "<",
    );
  };

  if (done) return null;

  const halfFolds = FOLD_COUNT / 2;

  return (
    <div
      ref={wrapperRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={clsx(
        "fixed inset-0 z-100 flex",
        clicked ? "cursor-default" : "cursor-pointer",
        done ? "pointer-events-none" : "pointer-events-auto",
      )}
    >
      {/* ── Top valance ─────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-20 z-5"
        style={{
          background: `linear-gradient(180deg, ${theme.curtainDark} 0%, ${theme.curtain} 100%)`,
          borderBottom: `3px solid ${theme.gold}`,
          boxShadow: `0 4px 30px rgba(0,0,0,0.9), 0 0 20px ${theme.gold}40`,
        }}
      >
        {/* Valance scallops */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="absolute -bottom-5 w-10 h-10"
            style={{
              left: `${(i / 8) * 100}%`,
              transform: "translateX(-50%)",
              borderRadius: "50% 50% 50% 50% / 0 0 100% 100%",
              background: theme.curtain,
              borderBottom: `2px solid ${theme.gold}`,
            }}
          />
        ))}
      </div>

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div
        ref={leftRef}
        className={clsx(
          "absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden",
          !clicked && "shadow-[10px_0_40px_rgba(0,0,0,0.8)]",
        )}
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: halfFolds }).map((_, i) => (
            <div
              key={i}
              className="curtain-fold flex-1 h-full"
              style={{
                background: `linear-gradient(90deg,
                  ${theme.curtainDark} 0%,
                  ${theme.curtain} ${30 + (i % 2) * 10}%,
                  ${theme.curtainSheen} 50%,
                  ${theme.curtain} 70%,
                  ${theme.curtainDark} 100%)`,
              }}
            />
          ))}
        </div>
        {/* Gold trim right edge */}
        <div
          className="absolute top-0 bottom-0 right-0 w-1.5"
          style={{
            background: `linear-gradient(180deg, ${theme.goldLight}, ${theme.gold}, ${theme.goldLight})`,
            boxShadow: `0 0 20px ${theme.gold}`,
          }}
        />
        {/* Mouse shimmer */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${100 - shimmer.x * 2}% ${shimmer.y}%, rgba(255,255,255,0.8) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div
        ref={rightRef}
        className={clsx(
          "absolute top-0 bottom-0 right-0 w-1/2 overflow-hidden",
          !clicked && "shadow-[-10px_0_40px_rgba(0,0,0,0.8)]",
        )}
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: halfFolds }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full"
              style={{
                background: `linear-gradient(90deg,
                  ${theme.curtainDark} 0%,
                  ${theme.curtain} ${30 + (i % 2) * 10}%,
                  ${theme.curtainSheen} 50%,
                  ${theme.curtain} 70%,
                  ${theme.curtainDark} 100%)`,
              }}
            />
          ))}
        </div>
        {/* Gold trim left edge */}
        <div
          className="absolute top-0 bottom-0 left-0 w-1.5"
          style={{
            background: `linear-gradient(180deg, ${theme.goldLight}, ${theme.gold}, ${theme.goldLight})`,
            boxShadow: `0 0 20px ${theme.gold}`,
          }}
        />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${shimmer.x * 2 - 100}% ${shimmer.y}%, rgba(255,255,255,0.8) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* ── Centre CTA ─────────────────────────────────────────────────── */}
      {!clicked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <p className="font-display animate-pulse-soft text-center text-[clamp(28px,5vw,56px)] text-(--theme-gold) [text-shadow:0_0_40px_var(--theme-gold-80),0_2px_4px_rgba(0,0,0,0.9)] tracking-[0.15em]">
            You Are Invited
          </p>
          <p
            className="font-label uppercase"
            style={{
              fontSize: "clamp(11px,1.5vw,16px)",
              color: `${theme.gold}99`,
              letterSpacing: "0.45em",
            }}
          >
            Click to Enter
          </p>
          <span style={{ color: theme.gold, fontSize: 28, opacity: 0.7 }}>
            ❧
          </span>
        </div>
      )}

      {clicked && !done && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
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
    </div>
  );
}
