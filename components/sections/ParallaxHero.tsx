"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";

export function ParallaxHero() {
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
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        height: "90vh",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(30px)",
        transition:
          "opacity 1.4s ease, transform 1.4s cubic-bezier(0.16,1,0.3,1)",
        background: `radial-gradient(ellipse at 50% ${30 - scrollY * 0.015}%, ${theme.curtain}50 0%, ${theme.bg} 70%)`,
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
        <p
          className="font-label font-semibold uppercase tracking-[1.2em] text-[14px]"
          style={{ color: `${theme.gold}90` }}
        >
          Together in Love
        </p>

        <h1
          className="font-display font-light leading-none"
          style={{
            fontSize: "clamp(48px,10vw,120px)",
            color: theme.text,
            letterSpacing: "0.04em",
          }}
        >
          {process.env.NEXT_PUBLIC_BRIDE}
          <br />
          <span style={{ color: theme.gold, opacity: 0.8 }}>&</span>
          <br />
          {process.env.NEXT_PUBLIC_GROOM}
        </h1>

        <p
          className="font-display italic"
          style={{
            fontSize: "clamp(14px,2.5vw,22px)",
            color: `${theme.text}55`,
            letterSpacing: "0.08em",
          }}
        >
          {process.env.NEXT_PUBLIC_TAG_LINE} 2026
        </p>

        <div
          className="w-20 h-px my-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
          }}
        />

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
