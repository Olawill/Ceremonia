"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface Props {
  onOpen: () => void;
  bladeCount?: number;
}

export function IrisCurtain({ onOpen, bladeCount = 8 }: Props) {
  const bladeRefs = useRef<(HTMLDivElement | null)[]>([]);
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

    tl.to(promptRef.current, { opacity: 0, duration: 0.2 });
    tl.to(
      bladeRefs.current.filter(Boolean),
      {
        scaleY: 0,
        transformOrigin: "center top",
        duration: 0.9,
        ease: "power3.inOut",
        stagger: {
          amount: 0.4,
          from: "center",
        },
      },
      "<0.1",
    );
  };

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-100 cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Blades arranged as vertical slices that collapse from center */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: bladeCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              bladeRefs.current[i] = el;
            }}
            className="flex-1 h-full"
            style={{
              background:
                i % 2 === 0
                  ? `linear-gradient(180deg, ${theme.curtain}, ${theme.curtainDark})`
                  : `linear-gradient(180deg, ${theme.curtainDark}, ${theme.curtainSheen})`,
              borderRight:
                i < bladeCount - 1 ? `1px solid ${theme.gold}15` : "none",
            }}
          />
        ))}
      </div>

      {/* Gold iris ring overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-full border-2"
          style={{
            width: "min(60vw, 60vh)",
            height: "min(60vw, 60vh)",
            borderColor: `${theme.gold}30`,
            boxShadow: `0 0 60px ${theme.gold}15, inset 0 0 60px ${theme.gold}10`,
          }}
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
            Touch to Open
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
