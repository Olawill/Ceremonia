"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface Props {
  onOpen: () => void;
  panelCount?: number;
}

export function CascadeCurtain({ onOpen, panelCount = 5 }: Props) {
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
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
      panelRefs.current.filter(Boolean),
      { yPercent: -110, duration: 1.2, ease: "power4.in", stagger: 0.08 },
      "<0.1",
    );
  };

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex"
      style={{ cursor: clicked ? "default" : "pointer" }}
      onClick={handleClick}
    >
      {Array.from({ length: panelCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="flex-1 h-full"
          style={{
            background:
              i % 2 === 0
                ? `linear-gradient(180deg, ${theme.curtain}, ${theme.curtainDark})`
                : `linear-gradient(180deg, ${theme.curtainSheen}, ${theme.curtain})`,
            borderRight:
              i < panelCount - 1 ? `1px solid ${theme.gold}20` : "none",
          }}
        />
      ))}

      {!clicked && (
        <div
          ref={promptRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4"
        >
          <p
            className="font-label text-[11px] tracking-[0.5em] uppercase animate-pulse-soft"
            style={{ color: theme.gold }}
          >
            Touch to Unveil
          </p>
        </div>
      )}
    </div>
  );
}
