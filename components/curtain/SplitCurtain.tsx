"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface Props {
  onOpen: () => void;
}

export function SplitCurtain({ onOpen }: Props) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
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

    tl.to(promptRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" });
    tl.to(
      topRef.current,
      { yPercent: -100, duration: 1.4, ease: "power4.inOut" },
      "<0.1",
    );
    tl.to(
      bottomRef.current,
      { yPercent: 100, duration: 1.4, ease: "power4.inOut" },
      "<",
    );
  };

  if (done) return null;

  return (
    <div className="fixed inset-0 z-100 cursor-pointer" onClick={handleClick}>
      {/* Top half */}
      <div
        ref={topRef}
        className="absolute top-0 left-0 right-0 h-1/2"
        style={{
          background: `linear-gradient(180deg, ${theme.curtainDark}, ${theme.curtain})`,
        }}
      >
        {/* Gold seam at bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />
        {/* Fold lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px opacity-20"
            style={{
              left: `${(i + 1) * (100 / 7)}%`,
              background: `linear-gradient(180deg, ${theme.curtainSheen}, ${theme.curtain})`,
            }}
          />
        ))}
      </div>

      {/* Bottom half */}
      <div
        ref={bottomRef}
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `linear-gradient(180deg, ${theme.curtain}, ${theme.curtainDark})`,
        }}
      >
        {/* Gold seam at top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px opacity-20"
            style={{
              left: `${(i + 1) * (100 / 7)}%`,
              background: `linear-gradient(180deg, ${theme.curtain}, ${theme.curtainSheen})`,
            }}
          />
        ))}
      </div>

      {!clicked && (
        <div
          ref={promptRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4 z-10"
        >
          <p
            className="font-label text-[11px] tracking-[0.5em] uppercase animate-pulse-soft"
            style={{ color: theme.gold }}
          >
            Touch to Part
          </p>
          <div
            className="w-16 h-px"
            style={{ background: `${theme.gold}60` }}
          />
        </div>
      )}
    </div>
  );
}
