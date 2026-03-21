"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { DressCodeConfig, DressCodeStyle } from "@/types/event";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  dressCode: DressCodeConfig;
}

const STYLE_META: Record<
  DressCodeStyle,
  { label: string; icon: string; description: string }
> = {
  // existing entries unchanged
  "black-tie": {
    label: "Black Tie",
    icon: "🎩",
    description: "Tuxedos & floor-length gowns",
  },
  "black-tie-optional": {
    label: "Black Tie Optional",
    icon: "🥂",
    description: "Tuxedos welcome, dark suits accepted",
  },
  cocktail: {
    label: "Cocktail Attire",
    icon: "🍸",
    description: "Suits & cocktail or midi dresses",
  },
  "smart-casual": {
    label: "Smart Casual",
    icon: "✨",
    description: "Neat, polished — no jeans or trainers",
  },
  "garden-party": {
    label: "Garden Party",
    icon: "🌸",
    description: "Florals, linens & block colours welcome",
  },
  "beach-formal": {
    label: "Beach Formal",
    icon: "🌊",
    description: "Light fabrics, no stilettos",
  },
  casual: {
    label: "Casual",
    icon: "☀️",
    description: "Come comfortable — just celebrate with us",
  },
  // new entries
  "african-formal": {
    label: "African Formal",
    icon: "🪘",
    description: "Aso-ebi, agbada, kente & traditional dress welcome",
  },
  "south-asian-formal": {
    label: "South Asian Formal",
    icon: "🪷",
    description: "Sarees, lehengas, sherwanis & formal kurta sets",
  },
  "east-asian-formal": {
    label: "East Asian Formal",
    icon: "🏮",
    description: "Qipao, hanbok, kimono or formal Western dress",
  },
  "middle-eastern": {
    label: "Middle Eastern",
    icon: "🌙",
    description: "Thobes, abayas, kaftans & elegant formal wear",
  },
  "latin-formal": {
    label: "Latin Formal",
    icon: "🌺",
    description: "Guayaberas, huipil, or elegant festa attire",
  },
  "smart-traditional": {
    label: "Smart Traditional",
    icon: "🤝",
    description: "Your finest cultural or formal attire — both celebrated",
  },
  traditional: {
    label: "Traditional Attire",
    icon: "👘",
    description: "Dress in your cultural best — all traditions honoured",
  },
};

export function DressCode({ dressCode }: Props) {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const meta = STYLE_META[dressCode.style];

  useEffect(() => {
    if (!contentRef.current) return;
    const els = contentRef.current.querySelectorAll(".dc-animate");
    gsap.fromTo(
      els,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 75%",
        },
      },
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center px-8! py-24! gap-12"
      style={{ background: theme.bg }}
    >
      <div
        ref={contentRef}
        className="w-full max-w-2xl flex flex-col items-center gap-10"
      >
        {/* Label */}
        <p
          className="dc-animate font-label text-[11px] tracking-[0.6em] uppercase"
          style={{ color: theme.gold }}
        >
          Dress Code
        </p>

        {/* Main style card */}
        <div
          className="dc-animate w-full flex flex-col items-center gap-4 py-12! px-8! rounded-2xl border"
          style={{
            borderColor: `${theme.gold}30`,
            background: `${theme.gold}05`,
          }}
        >
          <span className="text-5xl">{meta.icon}</span>
          <h2
            className="font-display text-[clamp(28px,5vw,48px)] tracking-widest"
            style={{ color: theme.text }}
          >
            {dressCode.title ?? meta.label}
          </h2>
          <p
            className="font-display italic text-lg"
            style={{ color: `${theme.text}80` }}
          >
            {meta.description}
          </p>
          {dressCode.description && (
            <p
              className="font-display text-base text-center max-w-md mt-2!"
              style={{ color: `${theme.text}70` }}
            >
              {dressCode.description}
            </p>
          )}
        </div>

        {/* Colour palette */}
        {dressCode.colourPalette && dressCode.colourPalette.length > 0 && (
          <div className="dc-animate flex flex-col items-center gap-4 w-full">
            <p
              className="font-label text-[10px] tracking-[0.5em] uppercase"
              style={{ color: `${theme.gold}80` }}
            >
              Suggested Palette
            </p>
            <div className="flex gap-3">
              {dressCode.colourPalette.map((colour) => (
                <div
                  key={colour}
                  className="size-10 rounded-full border-2 shadow-lg"
                  style={{
                    background: colour,
                    borderColor: `${theme.gold}40`,
                    boxShadow: `0 4px 20px ${colour}60`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Avoid colours */}
        {dressCode.avoidColours && dressCode.avoidColours.length > 0 && (
          <div className="dc-animate flex flex-col items-center gap-4 w-full">
            <p
              className="font-label text-[10px] tracking-[0.5em] uppercase"
              style={{ color: `${theme.gold}80` }}
            >
              Please Avoid
            </p>
            <div className="flex gap-3 items-center">
              {dressCode.avoidColours.map((colour) => (
                <div key={colour} className="relative size-10">
                  <div
                    className="size-10 rounded-full border-2"
                    style={{
                      background: colour,
                      borderColor: `${theme.gold}40`,
                    }}
                  />
                  {/* Cross overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute w-full h-0.5 rotate-45 rounded"
                      style={{ background: "#ff4444cc" }}
                    />
                    <div
                      className="absolute w-full h-0.5 -rotate-45 rounded"
                      style={{ background: "#ff4444cc" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {dressCode.notes && (
          <div
            className="dc-animate w-full flex items-start gap-3 px-6! py-4! rounded-xl border"
            style={{
              borderColor: `${theme.gold}20`,
              background: `${theme.gold}08`,
            }}
          >
            <span style={{ color: theme.gold }}>✦</span>
            <p
              className="font-display italic text-sm"
              style={{ color: `${theme.text}70` }}
            >
              {dressCode.notes}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
