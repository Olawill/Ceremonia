"use client";

import { useTheme } from "@/lib/ThemeContext";
import clsx from "clsx";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface TimelineEvent {
  year: string;
  icon: string;
  title: string;
  desc: string;
}

const EVENTS: TimelineEvent[] = [
  {
    year: "2019",
    icon: "✦",
    title: "How We Met",
    desc: "A chance encounter at a gallery opening changed everything. Two strangers, one conversation, infinite futures.",
  },
  {
    year: "2024",
    icon: "◆",
    title: "The Proposal",
    desc: "Under the stars in Santorini, on bended knee with trembling hands and an overflowing heart.",
  },
  {
    year: "2026",
    icon: "❧",
    title: "Forever Begins",
    desc: "Join us as we begin the greatest adventure of our lives, surrounded by everyone we love.",
  },
];

interface TimelineProps {
  events?: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const items = Array.from(
      section.querySelectorAll<HTMLElement>(".timeline-item"),
    );
    if (!items.length) return;

    // Guard: skip GSAP entirely if elements are not attached to the document
    // (happens in rooms mode where sections are hidden off-screen)
    if (!document.body.contains(section)) return;

    const scrollContainer = document.querySelector("[data-scroll-container]");

    const triggers: ScrollTrigger[] = [];

    items.forEach((item, i) => {
      // Null-guard: element must be in the DOM before GSAP can touch it
      if (!item) return;

      gsap.set(item, { opacity: 0, y: i % 2 === 0 ? 70 : -70 });

      // In rooms mode there is no scroll container — fall back to a simple
      // IntersectionObserver-style trigger using the viewport as scroller
      const st = ScrollTrigger.create({
        trigger: item,
        ...(scrollContainer ? { scroller: scrollContainer } : {}),
        start: "top 82%",
        onEnter: () => {
          if (!item) return;
          gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            delay: i * 0.12,
          });
        },
      });
      triggers.push(st);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center gap-20 py-32! px-5!"
      style={{
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgMid} 50%, ${theme.bg} 100%)`,
      }}
    >
      {/* Heading */}
      <div className="text-center space-y-4!">
        <p
          className="font-label uppercase tracking-[0.5em] text-[14px] font-semibold"
          style={{ color: `${theme.gold}70` }}
        >
          Our Story
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(32px,6vw,64px)",
            color: theme.text,
            letterSpacing: "0.08em",
          }}
        >
          The Journey Here
        </h2>
      </div>

      {/* Events */}
      <div className="relative w-full max-w-2xl">
        {/* Vertical line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
          style={{
            background: `linear-gradient(180deg, transparent, ${theme.gold}60, ${theme.gold}, ${theme.gold}60, transparent)`,
          }}
        />

        {(events ?? EVENTS).map((ev, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={`${ev.year}-${i}`}
              className={clsx(
                "timeline-item relative flex items-center gap-10 mb-20!",
                isLeft ? "flex-row" : "flex-row-reverse",
              )}
            >
              {/* Card */}
              <div
                className={clsx(
                  "w-[calc(50%-32px)] rounded-xl p-4! backdrop-blur-sm",
                  "bg-[linear-gradient(135deg,var(--theme-curtain)_0%,var(--theme-bg)_90%)]",
                  "border border-(--theme-gold) shadow-[0_4px_40px_rgba(0,0,0,0.5)]",
                  isLeft ? "text-right" : "text-left",
                )}
              >
                <p className="font-label font-bold text-[13px] tracking-[0.4em] mb-2! text-(--theme-gold) opacity-80">
                  {ev.year}
                </p>
                <h3 className="font-display font-light mb-2! text-[clamp(18px,3vw,26px)] text-(--theme-text) tracking-[0.05em]">
                  {ev.title}
                </h3>
                <p className="font-display italic leading-relaxed text-base text-(--theme-text) opacity-75">
                  {ev.desc}
                </p>
              </div>

              {/* Centre dot */}
              <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg z-10 text-(--theme-text) border-2 border-(--theme-gold) bg-[radial-gradient(circle,var(--theme-gold),var(--theme-curtain))] shadow-[0_0_30px_var(--theme-gold)]">
                {ev.icon}
              </div>

              {/* <div className="flex-1" /> */}
            </div>
          );
        })}
      </div>
    </section>
  );
}
