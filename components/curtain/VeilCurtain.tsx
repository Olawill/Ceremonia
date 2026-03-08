"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface Props {
  onOpen: () => void;
}

export function VeilCurtain({ onOpen }: Props) {
  const veilRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [clicked, setClicked] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setDone(true);
        onOpen();
      },
    });

    tl.to(promptRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" });
    tl.to(
      veilRef.current,
      {
        yPercent: -100,
        opacity: 0,
        duration: 2.2,
        ease: "power2.inOut",
      },
      "<0.2",
    );
  };

  if (done) return null;

  return (
    <div className="fixed inset-0 z-100 cursor-pointer" onClick={handleClick}>
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${theme.curtainDark}FF 0%,
            ${theme.curtain}EE 30%,
            ${theme.curtain}CC 60%,
            ${theme.curtainDark}AA 100%)`,
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Subtle fabric texture lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${(i + 1) * (100 / 13)}%`,
              background: `linear-gradient(180deg, transparent, ${theme.curtainSheen}30, transparent)`,
            }}
          />
        ))}
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${theme.goldLight}40 0%, transparent 60%)`,
          }}
        />
      </div>

      {!clicked && (
        <div
          ref={promptRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-6 z-10"
        >
          <p
            className="font-display text-[clamp(20px,3vw,36px)] tracking-[0.2em]"
            style={{
              color: theme.gold,
              textShadow: `0 0 30px ${theme.gold}60`,
            }}
          >
            Lift the Veil
          </p>
          <p
            className="font-label text-[10px] tracking-[0.5em] uppercase animate-pulse-soft"
            style={{ color: `${theme.gold}80` }}
          >
            Touch to Begin
          </p>
        </div>
      )}
    </div>
  );
}
