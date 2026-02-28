"use client";

import { useTheme } from "@/lib/ThemeContext";
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

export function Timeline() {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const items =
      sectionRef.current?.querySelectorAll<HTMLElement>(".timeline-item");
    if (!items) return;

    const triggers: ScrollTrigger[] = [];

    items.forEach((item, i) => {
      gsap.set(item, { opacity: 0, y: i % 2 === 0 ? 70 : -70 });

      const st = ScrollTrigger.create({
        trigger: item,
        scroller: "[data-scroll-container]",
        start: "top 82%",
        onEnter: () =>
          gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            delay: i * 0.12,
          }),
      });
      triggers.push(st);
    });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center gap-20 py-32 px-5"
      style={{
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgMid} 50%, ${theme.bg} 100%)`,
      }}
    >
      {/* Heading */}
      <div className="text-center space-y-4">
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

        {EVENTS.map((ev, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={ev.year}
              className={`timeline-item relative flex items-center gap-10 mb-20
                ${isLeft ? "flex-row" : "flex-row-reverse"}`}
            >
              {/* Card */}
              <div
                className="w-[calc(50%-32px)] rounded-xl p-7 backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.curtain}18, ${theme.bg}90)`,
                  border: `1px solid ${theme.gold}28`,
                  boxShadow: `0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.gold}18`,
                  textAlign: isLeft ? "right" : "left",
                  padding: "8px",
                }}
              >
                <p
                  className="font-label font-bold text-[13px] tracking-[0.4em] mb-2"
                  style={{ color: `${theme.gold}80` }}
                >
                  {ev.year}
                </p>
                <h3
                  className="font-display font-light mb-2"
                  style={{
                    fontSize: "clamp(18px,3vw,26px)",
                    color: theme.text,
                    letterSpacing: "0.05em",
                  }}
                >
                  {ev.title}
                </h3>
                <p
                  className="font-display italic leading-relaxed"
                  style={{ color: `${theme.text}75`, fontSize: 16 }}
                >
                  {ev.desc}
                </p>
              </div>

              {/* Centre dot */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg z-10"
                style={{
                  background: `radial-gradient(circle, ${theme.gold}, ${theme.curtain})`,
                  border: `2px solid ${theme.gold}`,
                  boxShadow: `0 0 30px ${theme.gold}60, 0 0 60px ${theme.gold}20`,
                  color: theme.text,
                }}
              >
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
