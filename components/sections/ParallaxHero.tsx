"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import { EventType } from "@/types/event";
import clsx from "clsx";

interface ParallaxHeroProps {
  bride?: string;
  groom?: string;
  tagLine?: string;
  heroPhotoUrl?: string;
  topLabel?: string;
  eventType?: EventType;
  isRooms?: boolean;
}

export function ParallaxHero({
  bride = "Taiwo",
  groom,
  tagLine,
  heroPhotoUrl,
  topLabel,
  eventType = "wedding",
  isRooms = false,
}: ParallaxHeroProps) {
  const scrollCopy: Record<string, string> = {
    wedding: "Scroll to begin the journey ↓",
    birthday: "Scroll to join the celebration ↓",
    baby_shower: "Scroll to meet the little one ↓",
    christening: "Scroll to share the blessing ↓",
    bridal_shower: "Scroll to celebrate the bride ↓",
    housewarming: "Scroll to see the new home ↓",
    anniversary: "Scroll to celebrate with us ↓",
    graduation: "Scroll to share the moment ↓",
    engagement: "Scroll to celebrate with us ↓",
    corporate: "Scroll to explore the event ↓",
    other: "Scroll to continue ↓",
  };
  const scrollPrompt = scrollCopy[eventType] ?? scrollCopy.wedding;

  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Fade in smoothly after mount (curtain has just opened)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (isRooms) return; // no scroll in rooms — window.scrollY is always 0
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isRooms]);

  return (
    <section
      className={clsx(
        "min-h-screen flex flex-col items-center justify-center relative transition-[opacity,transform] duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)]",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[30px]",
      )}
      style={{
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${heroPhotoUrl})`
          : isRooms
            ? "none" // transparent — 3D room is the background
            : `radial-gradient(ellipse at 50% ${30 - scrollY * 0.015}%, var(--theme-curtain)50 0%, var(--theme-bg) 70%)`,
        backgroundSize: heroPhotoUrl ? "cover" : undefined,
        backgroundPosition: heroPhotoUrl ? "center" : undefined,
        // In rooms mode, add a subtle dark scrim so text is legible against the 3D scene
        ...(isRooms && !heroPhotoUrl
          ? {
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 100%)",
            }
          : {}),
      }}
    >
      {/* Parallax orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: "5%",
          left: "5%",
          transform: isRooms ? "none" : `translateY(${scrollY * 0.28}px)`,
          background: `radial-gradient(circle, ${theme.gold}06, transparent 70%)`,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 350,
          height: 350,
          bottom: "8%",
          right: "5%",
          transform: isRooms ? "none" : `translateY(${scrollY * 0.18}px)`,
          background: `radial-gradient(circle, ${theme.curtain}30, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center gap-5 px-6!"
        style={{
          transform: isRooms ? "none" : `translateY(${scrollY * 0.12}px)`,
        }}
      >
        <p
          className="font-label font-semibold uppercase tracking-[1.2em] text-[14px] text-(--theme-gold) opacity-90"
          style={
            isRooms ? { textShadow: "0 1px 12px rgba(0,0,0,0.9)" } : undefined
          }
        >
          {topLabel ?? "Together in Love"}
        </p>

        <h1
          className="font-display font-light leading-none text-[clamp(48px,10vw,120px)] text-(--theme-text) tracking-[0.04em]"
          style={
            isRooms
              ? {
                  textShadow:
                    "0 2px 24px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)",
                }
              : undefined
          }
        >
          {bride}
          {groom && groom.trim().length > 0 && (
            <>
              <br />
              <span className="text-(--theme-gold) opacity-80">&</span>
              <br />
              {groom}
            </>
          )}
        </h1>

        {tagLine && (
          <p
            className="font-display italic"
            style={{
              fontSize: "clamp(14px,2.5vw,22px)",
              color: isRooms ? `${theme.text}CC` : `${theme.text}55`,
              letterSpacing: "0.08em",
              textShadow: isRooms ? "0 1px 8px rgba(0,0,0,0.9)" : undefined,
            }}
          >
            {tagLine}
          </p>
        )}

        <div className="w-20 h-px my-1 bg-[linear-gradient(90deg,transparent,var(--theme-gold),transparent)]" />

        <p
          className="font-display italic"
          style={{
            fontSize: "clamp(14px,2.5vw,22px)",
            color: isRooms ? `${theme.text}CC` : `${theme.text}55`,
            letterSpacing: "0.08em",
            textShadow: isRooms ? "0 1px 8px rgba(0,0,0,0.9)" : undefined,
          }}
        >
          {scrollPrompt} ↓
        </p>
      </div>
    </section>
  );
}
