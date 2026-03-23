"use client";

import gsap from "gsap";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { EventConfig } from "@/types/event";

interface Section {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface RoomsEngineProps {
  config: EventConfig;
  sections: Section[];
}

const ROOM_DEPTH = 1400; // px between rooms along Z axis

// Room label — a decorative placard shown at the base of each room
function RoomPlacard({
  label,
  gold,
  visible,
}: {
  label: string;
  gold: string;
  visible: boolean;
}) {
  return (
    <div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, zIndex: 10 }}
    >
      <div
        className="font-label text-[10px] tracking-[0.5em] uppercase px-5 py-2 rounded-full"
        style={{
          border: `1px solid ${gold}40`,
          color: gold + "90",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function RoomsEngine({ config, sections }: RoomsEngineProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cameraRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = (index: number) => {
    if (isAnimating || index === activeIndex) return;
    const clamped = Math.max(0, Math.min(sections.length - 1, index));
    setIsAnimating(true);
    gsap.to(cameraRef.current, {
      z: -clamped * ROOM_DEPTH,
      duration: 1.1,
      ease: "power3.inOut",
      onComplete: () => {
        setActiveIndex(clamped);
        setIsAnimating(false);
      },
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        goTo(activeIndex + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(activeIndex - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, isAnimating]);

  // Touch/swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) goTo(dx > 0 ? activeIndex + 1 : activeIndex - 1);
    touchStartX.current = null;
  };

  // postMessage scroll-to support (mirrors the scroll engine's SCROLL_TO handler)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SCROLL_TO" && typeof e.data.index === "number") {
        goTo(e.data.index);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [activeIndex, isAnimating]);

  return (
    <div
      className="fixed inset-0"
      style={{ background: theme.bg, color: theme.text }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 3D scene container ── */}
      <div
        className="absolute inset-0"
        style={{ perspective: "900px", perspectiveOrigin: "50% 50%" }}
      >
        {/* Camera — moves along Z axis */}
        <div
          ref={cameraRef}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            // initial transform so gsap.to(z:...) works
            transform: "translateZ(0px)",
          }}
        >
          {sections.map((section, i) => {
            const zPos = -i * ROOM_DEPTH;
            const isActive = i === activeIndex;
            // Rooms far away fade slightly
            const distance = Math.abs(i - activeIndex);

            return (
              <div
                key={section.key}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateZ(${zPos}px)`,
                  transformStyle: "preserve-3d",
                  opacity: distance > 1 ? 0 : distance === 1 ? 0.4 : 1,
                  transition: "opacity 0.4s ease",
                  background: i % 2 === 0 ? theme.bg : theme.bgMid,
                  overflow: "hidden",
                }}
              >
                {/* Side wall panels — create depth illusion */}
                <div
                  className="absolute top-0 bottom-0 left-0 w-16 pointer-events-none"
                  style={{
                    transformOrigin: "left center",
                    transform: "rotateY(90deg)",
                    background: `linear-gradient(90deg, ${theme.curtainDark}80, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 w-16 pointer-events-none"
                  style={{
                    transformOrigin: "right center",
                    transform: "rotateY(-90deg)",
                    background: `linear-gradient(270deg, ${theme.curtainDark}80, transparent)`,
                  }}
                />

                {/* Section content */}
                <div className="absolute inset-0 overflow-y-auto">
                  {section.node}
                </div>

                {/* Room placard */}
                <RoomPlacard
                  label={section.label}
                  gold={theme.gold}
                  visible={isActive}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Navigation controls ── */}
      {/* Prev button */}
      {activeIndex > 0 && (
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={isAnimating}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
          style={{
            width: 44,
            height: 44,
            background: "rgba(0,0,0,0.5)",
            border: `1px solid ${theme.gold}30`,
            color: theme.gold,
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeftIcon className="size-5" />
        </button>
      )}

      {/* Next button */}
      {activeIndex < sections.length - 1 && (
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={isAnimating}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
          style={{
            width: 44,
            height: 44,
            background: "rgba(0,0,0,0.5)",
            border: `1px solid ${theme.gold}30`,
            color: theme.gold,
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronRightIcon className="size-5" />
        </button>
      )}

      {/* Room dots */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {sections.map((s, i) => (
          <button
            key={s.key}
            onClick={() => goTo(i)}
            disabled={isAnimating}
            title={s.label}
            className="rounded-full transition-all disabled:cursor-default"
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              background: i === activeIndex ? theme.gold : theme.gold + "40",
              border: `1px solid ${theme.gold}60`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
