"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import clsx from "clsx";

interface ParallaxHeroProps {
  bride?: string;
  groom?: string;
  tagLine?: string;
  heroPhotoUrl?: string;
  topLabel?: string;
}

export function ParallaxHero({
  bride = "Taiwo",
  groom = "Tayo",
  tagLine,
  heroPhotoUrl,
  topLabel,
}: ParallaxHeroProps) {
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Fade in smoothly after mount (curtain has just opened)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className={clsx(
        "min-h-screen flex flex-col items-center justify-center relative transition-[opacity,transform] duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)]",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[30px]",
      )}
      style={{
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${heroPhotoUrl})`
          : `radial-gradient(ellipse at 50% ${30 - scrollY * 0.015}%, var(--theme-curtain)50 0%, var(--theme-bg) 70%)`,
        backgroundSize: heroPhotoUrl ? "cover" : undefined,
        backgroundPosition: heroPhotoUrl ? "center" : undefined,
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
          transform: `translateY(${scrollY * 0.28}px)`,
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
          transform: `translateY(${scrollY * 0.18}px)`,
          background: `radial-gradient(circle, ${theme.curtain}30, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center gap-5 px-6"
        style={{ transform: `translateY(${scrollY * 0.12}px)` }}
      >
        <p className="font-label font-semibold uppercase tracking-[1.2em] text-[14px] text-(--theme-gold) opacity-90">
          {topLabel ?? "Together in Love"}
        </p>

        <h1 className="font-display font-light leading-none text-[clamp(48px,10vw,120px)] text-(--theme-text) tracking-[0.04em]">
          {bride}
          {groom && (
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
              color: `${theme.text}55`,
              letterSpacing: "0.08em",
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
            color: `${theme.text}55`,
            letterSpacing: "0.08em",
          }}
        >
          Scroll to begin the journey ↓
        </p>
      </div>
    </section>
  );
}
