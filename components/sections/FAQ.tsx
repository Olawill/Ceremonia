"use client";

import clsx from "clsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { FaqItem } from "@/types/event";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  items: FaqItem[];
}

function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = answerRef.current;
    if (!el) return;
    if (open) {
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" },
      );
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in" });
    }
  }, [open]);

  return (
    <div
      className="faq-row border-b"
      style={{ borderColor: `${theme.gold}18` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-6 py-6! text-left"
      >
        <span
          className="font-display text-base md:text-lg tracking-wide"
          style={{ color: theme.text }}
        >
          <span
            className="font-label text-[10px] tracking-[0.4em] mr-3! align-middle"
            style={{ color: `${theme.gold}60` }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {item.question}
        </span>
        <ChevronDownIcon
          className={clsx(
            "size-4 shrink-0 mt-1! transition-transform duration-300",
            open && "rotate-180",
          )}
          style={{ color: theme.gold }}
        />
      </button>

      <div
        ref={answerRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <p
          className="font-display italic text-sm md:text-base pb-6! leading-relaxed"
          style={{ color: `${theme.text}70` }}
        >
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ({ items }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll(".faq-row");
    gsap.fromTo(
      rows,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      },
    );
  }, []);

  if (!items.length) return null;

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-8! py-24! gap-12"
      style={{ background: theme.bgMid ?? theme.bg }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <p
            className="font-label text-[11px] tracking-[0.6em] uppercase"
            style={{ color: theme.gold }}
          >
            Questions & Answers
          </p>
          <h2
            className="font-display text-[clamp(28px,5vw,48px)] tracking-[0.05em]"
            style={{ color: theme.text }}
          >
            FAQs
          </h2>
        </div>

        {/* Accordion */}
        <div
          ref={containerRef}
          className="w-full border-t"
          style={{ borderColor: `${theme.gold}18` }}
        >
          {items.map((item, i) => (
            <FaqRow key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
