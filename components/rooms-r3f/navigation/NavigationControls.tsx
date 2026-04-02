"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useRoomsStore } from "../store";

interface Section {
  key: string;
  label: string;
}

interface NavigationControlsProps {
  sections: Section[];
  activeRoomIndex: number;
  onNavigate: (index: number) => void;
  theme: { gold: string; text: string; bg: string };
  maxAllowedIndex: number;
  dateRevealed: boolean;
}

export function NavigationControls({
  sections,
  activeRoomIndex,
  onNavigate,
  theme,
  maxAllowedIndex,
  dateRevealed,
}: NavigationControlsProps) {
  const canGoLeft = activeRoomIndex > 0;
  // Date reveal gate: before reveal, can only navigate within the first 2 rooms (hero + scratch)
  const hardMax = dateRevealed
    ? sections.length - 1
    : Math.min(1, sections.length - 1);

  const roomPhase = useRoomsStore((s) => s.roomPhase);
  // Right is enabled if: outside (can enter), or inside and there's a next room
  const canGoRight = roomPhase === "outside" || activeRoomIndex < hardMax;

  const goLeft = useCallback(() => {
    const { roomPhase: phase } = useRoomsStore.getState();
    if (phase === "outside" && activeRoomIndex > 0) {
      // Go back inside the previous room
      onNavigate(activeRoomIndex - 1);
    } else if (phase === "inside" && canGoLeft) {
      onNavigate(activeRoomIndex - 1);
    }
  }, [canGoLeft, activeRoomIndex, onNavigate]);

  const goRight = useCallback(() => {
    const { roomPhase: phase, enterRoom: enter } = useRoomsStore.getState();
    if (phase === "outside") {
      enter();
    } else {
      // Inside — navigate to next room only if allowed
      const { dateRevealed: revealed } = useRoomsStore.getState();
      const max = revealed
        ? sections.length - 1
        : Math.min(1, sections.length - 1);
      if (activeRoomIndex < max) {
        onNavigate(activeRoomIndex + 1);
      }
    }
  }, [activeRoomIndex, onNavigate, sections.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        goLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        goRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goLeft, goRight]);

  return (
    <>
      {/* Room name banner */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            border: `1.5px solid ${theme.gold}`,
            borderRadius: 14,
            padding: "10px 28px",
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 24px ${theme.gold}30`,
          }}
        >
          <span
            style={{
              color: theme.gold,
              fontSize: "clamp(14px, 3vw, 22px)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: `0 0 16px ${theme.gold}`,
              display: "block",
            }}
          >
            {sections[activeRoomIndex]?.label ?? ""}
          </span>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "clamp(10px, 2vw, 12px)",
              marginTop: 4,
              letterSpacing: "0.15em",
            }}
          >
            {activeRoomIndex + 1} / {sections.length}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(20px, 5vw, 48px)",
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(16px, 4vw, 32px)",
          zIndex: 20,
          pointerEvents: "none",
          padding: "0 24px",
        }}
      >
        {/* Left arrow */}
        <button
          onClick={goLeft}
          disabled={!canGoLeft}
          aria-label="Previous room"
          style={{
            background: canGoLeft
              ? `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.7))`
              : "rgba(0,0,0,0.3)",
            border: `2.5px solid ${canGoLeft ? theme.gold : "rgba(255,255,255,0.15)"}`,
            borderRadius: 20,
            color: canGoLeft ? theme.gold : "rgba(255,255,255,0.25)",
            cursor: canGoLeft ? "pointer" : "not-allowed",
            padding: "clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            transition: "all 0.2s ease",
            boxShadow: canGoLeft
              ? `0 0 24px rgba(0,0,0,0.6), 0 0 16px ${theme.gold}50, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "none",
            minWidth: 64,
            minHeight: 64,
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            if (!canGoLeft) return;
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = "scale(1.08)";
            btn.style.boxShadow = `0 0 32px rgba(0,0,0,0.7), 0 0 24px ${theme.gold}70, inset 0 1px 0 rgba(255,255,255,0.15)`;
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = "scale(1)";
            btn.style.boxShadow = canGoLeft
              ? `0 0 24px rgba(0,0,0,0.6), 0 0 16px ${theme.gold}50, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "none";
          }}
        >
          <ChevronLeftIcon
            size={Math.max(28, Math.min(40, 28))}
            strokeWidth={2.5}
          />
        </button>

        {/* Progress pips */}
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 2vw, 14px)",
            alignItems: "center",
          }}
        >
          {sections.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeRoomIndex ? 14 : 9,
                height: i === activeRoomIndex ? 14 : 9,
                borderRadius: "50%",
                background:
                  i === activeRoomIndex ? theme.gold : "rgba(255,255,255,0.2)",
                border:
                  i === activeRoomIndex
                    ? `2px solid ${theme.gold}`
                    : "1.5px solid rgba(255,255,255,0.2)",
                transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow:
                  i === activeRoomIndex
                    ? `0 0 12px ${theme.gold}, 0 0 6px ${theme.gold}`
                    : "none",
                transform: i === activeRoomIndex ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={goRight}
          disabled={!canGoRight}
          aria-label="Next room"
          style={{
            background: canGoRight
              ? `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.7))`
              : "rgba(0,0,0,0.3)",
            border: `2.5px solid ${canGoRight ? theme.gold : "rgba(255,255,255,0.15)"}`,
            borderRadius: 20,
            color: canGoRight ? theme.gold : "rgba(255,255,255,0.25)",
            cursor: canGoRight ? "pointer" : "not-allowed",
            padding: "clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            transition: "all 0.2s ease",
            boxShadow: canGoRight
              ? `0 0 24px rgba(0,0,0,0.6), 0 0 16px ${theme.gold}50, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "none",
            minWidth: 64,
            minHeight: 64,
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            if (!canGoRight) return;
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = "scale(1.08)";
            btn.style.boxShadow = `0 0 32px rgba(0,0,0,0.7), 0 0 24px ${theme.gold}70, inset 0 1px 0 rgba(255,255,255,0.15)`;
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = "scale(1)";
            btn.style.boxShadow = canGoRight
              ? `0 0 24px rgba(0,0,0,0.6), 0 0 16px ${theme.gold}50, inset 0 1px 0 rgba(255,255,255,0.1)`
              : "none";
          }}
        >
          <ChevronRightIcon
            size={Math.max(28, Math.min(40, 28))}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Keyboard hint */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          pointerEvents: "none",
          color: "rgba(255,255,255,0.25)",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        ← → or A / D
      </div>
    </>
  );
}
