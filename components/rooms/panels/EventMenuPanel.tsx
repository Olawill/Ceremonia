"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { Course } from "@/types/event";
import { useEffect, useState } from "react";

interface Props {
  courses?: Course[];
  label?: string;
  subLabel?: string;
  description?: string;
}

const DEMO_COURSES: Course[] = [
  {
    course: "Amuse-Bouche",
    items: ["Truffle Arancini", "Burrata Crostini with Fig Jam"],
  },
  {
    course: "First Course",
    items: [
      "Seared Scallops · Cauliflower Purée · Caviar",
      "Heirloom Tomato Salad · Burrata · Basil Oil",
    ],
  },
  {
    course: "Main Course",
    items: [
      "Beef Tenderloin · Bordelaise · Pommes Dauphine",
      "Pan-Seared Sea Bass · Beurre Blanc · Asparagus",
      "Wild Mushroom Risotto · Parmesan (V)",
    ],
  },
  {
    course: "Dessert",
    items: [
      "Wedding Cake · Champagne Buttercream",
      "Crème Brûlée · Seasonal Berries",
    ],
  },
];

// ── Wax seal SVG ──────────────────────────────────────────────────────────────
function WaxSeal({ gold, curtain }: { gold: string; curtain: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      {/* Irregular blob */}
      <path
        d="M20,2 Q28,4 34,10 Q38,16 37,22 Q36,30 28,35 Q22,38 15,36 Q8,34 4,27 Q1,20 4,13 Q7,6 14,3 Z"
        fill={`${curtain}90`}
        stroke={`${gold}60`}
        strokeWidth="0.8"
      />
      {/* Radial gradient shimmer */}
      <circle
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke={`${gold}30`}
        strokeWidth="0.5"
      />
      {/* Embossed initial ring */}
      <circle
        cx="20"
        cy="20"
        r="10"
        fill="none"
        stroke={`${gold}50`}
        strokeWidth="1"
      />
      {/* Decorative cross/star */}
      <path
        d="M20,12 L20,28 M13,20 L27,20"
        stroke={`${gold}60`}
        strokeWidth="1"
      />
      <path
        d="M15.5,15.5 L24.5,24.5 M24.5,15.5 L15.5,24.5"
        stroke={`${gold}40`}
        strokeWidth="0.7"
      />
      {/* Centre dot */}
      <circle cx="20" cy="20" r="2.5" fill={`${gold}80`} />
      {/* Specular highlight */}
      <ellipse
        cx="16"
        cy="15"
        rx="4"
        ry="2.5"
        fill="rgba(255,255,255,0.12)"
        transform="rotate(-20,16,15)"
      />
    </svg>
  );
}

// ── Scroll roll end ───────────────────────────────────────────────────────────
function ScrollRoll({
  gold,
  curtain,
  top,
}: {
  gold: string;
  curtain: string;
  top: boolean;
}) {
  return (
    <div
      className="w-full h-5 rounded-full relative overflow-hidden"
      style={{
        background: `linear-gradient(${top ? "180deg" : "0deg"}, ${curtain}60, ${curtain}30)`,
        border: `1px solid ${gold}35`,
        boxShadow: top
          ? `0 4px 12px rgba(0,0,0,0.4), inset 0 -1px 0 ${gold}20`
          : `0 -4px 12px rgba(0,0,0,0.4), inset 0 1px 0 ${gold}20`,
      }}
    >
      {/* Roll shadow line */}
      <div
        className="absolute inset-x-0"
        style={{
          height: 2,
          top: top ? "60%" : "30%",
          background: `rgba(0,0,0,0.3)`,
        }}
      />
      {/* Highlight stripe */}
      <div
        className="absolute inset-x-4"
        style={{
          height: 1,
          top: top ? "25%" : "65%",
          background: `rgba(255,255,255,0.15)`,
        }}
      />
    </div>
  );
}

export function EventMenuPanel({
  courses,
  label,
  subLabel,
  description,
}: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [unrolled, setUnrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const displayCourses = courses ?? DEMO_COURSES;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    // Unroll animation after the panel fades in
    const t2 = setTimeout(() => setUnrolled(true), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Auto-cycle through courses every 3.5s when idle
  useEffect(() => {
    if (!unrolled) return;
    const t = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % displayCourses.length);
    }, 3500);
    return () => clearInterval(t);
  }, [unrolled, displayCourses.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-4">
      <style>{`
        @keyframes unroll {
          from { max-height: 0; opacity: 0; }
          to { max-height: 600px; opacity: 1; }
        }
        @keyframes flicker-in {
          0% { opacity: 0; transform: scaleY(0.95); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>

      {/* ── Scroll mount pin at top ── */}
      <div
        className="flex flex-col items-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <div
          className="w-1 h-8"
          style={{
            background: `linear-gradient(to bottom, transparent, ${theme.gold}50)`,
          }}
        />
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 16,
            height: 16,
            background: `radial-gradient(circle, ${theme.gold}80, ${theme.gold}40)`,
            border: `1px solid ${theme.gold}80`,
            boxShadow: `0 0 12px ${theme.gold}40`,
          }}
        />
      </div>

      {/* ── The physical scroll ── */}
      <div
        className="w-full max-w-sm flex flex-col"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition:
            "opacity 0.8s ease 0.1s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}
      >
        {/* Top roll */}
        <ScrollRoll gold={theme.gold} curtain={theme.curtain} top={true} />

        {/* Scroll body */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${theme.curtain}35 0%, rgba(0,0,0,0.65) 50%, ${theme.curtain}25 100%)`,
            border: `1px solid ${theme.gold}25`,
            borderTop: "none",
            borderBottom: "none",
            padding: "0 1px",
            // Scroll unroll animation
            maxHeight: unrolled ? 480 : 0,
            overflow: "hidden",
            transition: "max-height 1.2s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        >
          {/* Parchment texture lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{
                height: 1,
                top: `${(i + 1) * 8}%`,
                background: `rgba(255,255,255,0.03)`,
              }}
            />
          ))}

          <div className="px-5! py-5! flex flex-col items-center gap-4">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p
                className="font-label font-bold text-[8px] tracking-[0.6em] uppercase"
                style={{ color: `${theme.gold}95` }}
              >
                {subLabel ?? "Dinner Banquet"}
              </p>
              <h2
                className="font-display font-light"
                style={{
                  fontSize: "clamp(22px,3.5vw,30px)",
                  color: theme.text,
                  letterSpacing: "0.07em",
                  textShadow: `0 2px 12px rgba(0,0,0,0.8), 0 0 20px ${theme.gold}15`,
                }}
              >
                {label ?? "The Menu"}
              </h2>
              <div
                className="h-px w-20"
                style={{
                  background: `linear-gradient(90deg, transparent, ${theme.gold}60, transparent)`,
                }}
              />
              {description && (
                <p
                  className="font-display italic text-xs"
                  style={{
                    color: `${theme.text}95`,
                    textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Wax seal */}
            <WaxSeal gold={theme.gold} curtain={theme.curtain} />

            {/* Course tabs — click to browse */}
            <div className="flex gap-1 flex-wrap justify-center">
              {displayCourses.map((c, i) => (
                <button
                  key={c.course}
                  onClick={() => setActiveSection(i)}
                  className="font-label text-[7px] tracking-[0.3em] uppercase px-2! py-1! rounded-full transition-all cursor-pointer"
                  style={{
                    border: `1px solid ${i === activeSection ? theme.gold + "90" : theme.gold + "70"}`,
                    color: i === activeSection ? theme.gold : `${theme.gold}85`,
                    background:
                      i === activeSection ? `${theme.gold}15` : "transparent",
                  }}
                >
                  {c.course}
                </button>
              ))}
            </div>

            {/* Active course display */}
            <div
              className="w-full text-center"
              key={activeSection}
              style={{
                animation: "flicker-in 0.5s ease forwards",
                minHeight: 80,
              }}
            >
              <p
                className="font-label font-bold text-[8px] tracking-[0.45em] uppercase mb-3!"
                style={{ color: `${theme.gold}90` }}
              >
                {displayCourses[activeSection]?.course}
              </p>
              <div className="flex flex-col gap-1.5">
                {displayCourses[activeSection]?.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 justify-center"
                  >
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: `${theme.gold}50` }}
                    />
                    <p
                      className="font-display italic text-sm"
                      style={{
                        color: `${theme.text}`,
                        textShadow: "0 1px 6px rgba(0,0,0,0.7)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Page indicator dots */}
            <div className="flex gap-1.5 items-center">
              {displayCourses.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className="rounded-full transition-all cursor-pointer"
                  style={{
                    width: i === activeSection ? 16 : 4,
                    height: 4,
                    background:
                      i === activeSection ? theme.gold : `${theme.gold}30`,
                    border: `1px solid ${theme.gold}40`,
                  }}
                />
              ))}
            </div>

            {/* Dietary note */}
            <p
              className="font-label font-semibold text-[7px] tracking-[0.35em] uppercase text-center"
              style={{ color: `${theme.gold}80` }}
            >
              Dietary requirements accommodated on request
            </p>
          </div>
        </div>

        {/* Bottom roll */}
        <ScrollRoll gold={theme.gold} curtain={theme.curtain} top={false} />
      </div>

      {/* Bottom tassel */}
      <div
        className="flex flex-col items-center gap-0.5"
        style={{
          opacity: unrolled ? 0.6 : 0,
          transition: "opacity 0.6s ease 1.4s",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 2,
              height: i === 4 ? 8 : 3,
              background: `${theme.gold}${60 - i * 10}`,
            }}
          />
        ))}
        <div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            background: `radial-gradient(circle, ${theme.gold}80, ${theme.gold}30)`,
            border: `1px solid ${theme.gold}60`,
          }}
        />
      </div>
    </div>
  );
}
