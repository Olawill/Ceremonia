"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface Props {
  onOpen: () => void;
}

export function SheerCurtain({ onOpen }: Props) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
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

    tl.to(promptRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
    tl.to(
      leftRef.current,
      { xPercent: -100, duration: 1.2, ease: "power3.inOut" },
      "<",
    );
    tl.to(
      rightRef.current,
      { xPercent: 100, duration: 1.2, ease: "power3.inOut" },
      "<",
    );
  };

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex"
      style={{ cursor: clicked ? "default" : "pointer" }}
      onClick={handleClick}
    >
      <div
        ref={leftRef}
        className="w-1/2 h-full flex items-center justify-end"
        style={{
          background: `linear-gradient(to right, ${theme.curtainDark}CC, ${theme.curtain}99)`,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          className="w-px h-full"
          style={{ background: `${theme.gold}40` }}
        />
      </div>

      <div
        ref={rightRef}
        className="w-1/2 h-full flex items-center justify-start"
        style={{
          background: `linear-gradient(to left, ${theme.curtainDark}CC, ${theme.curtain}99)`,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          className="w-px h-full"
          style={{ background: `${theme.gold}40` }}
        />
      </div>

      {!clicked && (
        <div
          ref={promptRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4"
        >
          <p
            className="font-label text-[11px] tracking-[0.5em] uppercase animate-pulse-soft"
            style={{ color: theme.gold }}
          >
            Touch to Begin
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
