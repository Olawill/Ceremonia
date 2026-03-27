"use client";

import { useTheme } from "@/lib/ThemeContext";
import type { DressCodeConfig, DressCodeStyle } from "@/types/event";
import { useEffect, useState } from "react";

interface Props {
  dressCode: DressCodeConfig;
}

const STYLE_META: Record<
  DressCodeStyle,
  { label: string; icon: string; description: string }
> = {
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

// ── Tailor's dummy / dress form silhouette SVG ───────────────────────────────
function DressFormSVG({
  gold,
  curtain,
  text,
}: {
  gold: string;
  curtain: string;
  text: string;
}) {
  return (
    <svg viewBox="0 0 120 200" fill="none" className="w-24 mx-auto">
      {/* Stand pole */}
      <rect
        x="57"
        y="160"
        width="6"
        height="32"
        rx="3"
        fill={`${gold}80`}
        stroke={`${gold}`}
        strokeWidth="0.8"
      />
      {/* Base */}
      <ellipse
        cx="60"
        cy="192"
        rx="22"
        ry="6"
        fill={`${gold}70`}
        stroke={`${gold}90`}
        strokeWidth="0.8"
      />
      {/* Shoulder bar */}
      <rect
        x="28"
        y="54"
        width="64"
        height="4"
        rx="2"
        fill={`${gold}90`}
        stroke={`${gold}70`}
        strokeWidth="0.6"
      />
      {/* Neck */}
      <rect
        x="54"
        y="40"
        width="12"
        height="16"
        rx="6"
        fill={`${gold}70`}
        stroke={`${gold}90`}
        strokeWidth="0.6"
      />
      {/* Head/collar disk */}
      <ellipse
        cx="60"
        cy="40"
        rx="8"
        ry="5"
        fill={`${gold}25`}
        stroke={`${gold}90`}
        strokeWidth="0.8"
      />
      {/* Torso */}
      <path
        d="M32,58 Q24,80 26,110 Q28,140 60,155 Q92,140 94,110 Q96,80 88,58 Z"
        fill={`${curtain}40`}
        stroke={`${gold}80`}
        strokeWidth="1"
      />
      {/* Seam lines */}
      <line
        x1="60"
        y1="58"
        x2="60"
        y2="152"
        stroke={`${gold}70`}
        strokeWidth="0.8"
        strokeDasharray="3 3"
      />
      <path
        d="M40,90 Q60,95 80,90"
        stroke={`${gold}25`}
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M38,110 Q60,116 82,110"
        stroke={`${gold}25`}
        strokeWidth="0.7"
        fill="none"
      />
      {/* Decorative buttons */}
      {[75, 92, 109, 126].map((y, i) => (
        <circle
          key={i}
          cx="60"
          cy={y}
          r="2"
          fill={`${gold}`}
          stroke={`${gold}80`}
          strokeWidth="0.5"
        />
      ))}
      {/* Waist cinch */}
      <path
        d="M34,118 Q60,124 86,118"
        stroke={`${gold}45`}
        strokeWidth="1.2"
        fill="none"
      />
      {/* Glow around icon */}
      <ellipse cx="60" cy="95" rx="35" ry="50" fill={`${gold}04`} />
    </svg>
  );
}

// ── Colour swatch row ─────────────────────────────────────────────────────────
function ColourSwatches({
  colours,
  label,
  gold,
  strikethrough = false,
}: {
  colours: string[];
  label: string;
  gold: string;
  strikethrough?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className="font-label text-[8px] tracking-[0.5em] uppercase"
        style={{ color: `${gold}` }}
      >
        {label}
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {colours.map((colour) => (
          <div key={colour} className="relative">
            <div
              className="rounded-full border"
              style={{
                width: 28,
                height: 28,
                background: colour,
                borderColor: `${gold}80`,
                boxShadow: strikethrough ? "none" : `0 0 10px ${colour}60`,
              }}
            />
            {strikethrough && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DressCodePanel({ dressCode }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const meta = STYLE_META[dressCode.style];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6! gap-5">
      {/* ── Hanging garment card — like a tag on a coat rail ── */}
      <div
        className="flex flex-col items-center gap-5 w-full max-w-sm"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) rotateX(0deg)"
            : "translateY(-20px) rotateX(-8deg)",
          transition:
            "opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          transformOrigin: "top center",
        }}
      >
        {/* Coat hook */}
        <div
          className="flex flex-col items-center"
          style={{ marginBottom: -8 }}
        >
          <div
            className="w-0.5 h-6"
            style={{
              background: `linear-gradient(to bottom, transparent, ${theme.gold}60)`,
            }}
          />
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <path
              d="M10,2 Q14,2 16,6 Q18,10 10,12 Q2,10 4,6 Q6,2 10,2"
              stroke={`${theme.gold}70`}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Main card — styled like a luxury garment tag */}
        <div
          className="w-full rounded-2xl overflow-hidden relative"
          style={{
            border: `1px solid ${theme.gold}35`,
            background: `linear-gradient(160deg, rgba(0,0,0,0.75) 0%, ${theme.curtain}20 50%, rgba(0,0,0,0.7) 100%)`,
            boxShadow: `0 12px 48px rgba(0,0,0,0.7), inset 0 1px 0 ${theme.gold}20`,
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Top label stripe */}
          <div
            className="px-5! py-3! flex items-center justify-between"
            style={{
              borderBottom: `1px solid ${theme.gold}20`,
              background: `${theme.gold}08`,
            }}
          >
            <p
              className="font-label text-[8px] tracking-[0.5em] uppercase"
              style={{ color: `${theme.gold}90` }}
            >
              Dress Code
            </p>
            <span
              style={{
                color: theme.gold,
                fontSize: 14,
                filter: `drop-shadow(0 0 6px ${theme.gold}60)`,
              }}
            >
              {meta.icon}
            </span>
          </div>

          <div className="px-5! py-5! flex flex-col items-center gap-4">
            {/* Dress form illustration */}
            <DressFormSVG
              gold={theme.gold}
              curtain={theme.curtain}
              text={theme.text}
            />

            {/* Style name */}
            <div className="text-center flex flex-col gap-1">
              <h2
                className="font-display font-light"
                style={{
                  fontSize: "clamp(20px,3.5vw,28px)",
                  color: theme.text,
                  letterSpacing: "0.06em",
                  textShadow: `0 2px 16px rgba(0,0,0,0.8), 0 0 24px ${theme.gold}15`,
                }}
              >
                {dressCode.title ?? meta.label}
              </h2>
              <p
                className="font-display italic text-sm"
                style={{
                  color: `${theme.text}65`,
                  textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                }}
              >
                {meta.description}
              </p>
            </div>

            {/* Custom description */}
            {dressCode.description && (
              <p
                className="font-display italic text-xs text-center leading-relaxed"
                style={{
                  color: `${theme.text}80`,
                  borderTop: `1px solid ${theme.gold}15`,
                  paddingTop: 12,
                  width: "100%",
                }}
              >
                {dressCode.description}
              </p>
            )}

            {/* Colour palettes */}
            {(dressCode.colourPalette?.length ||
              dressCode.avoidColours?.length) && (
              <div
                className="w-full flex flex-col gap-3 pt-3!"
                style={{ borderTop: `1px solid ${theme.gold}15` }}
              >
                {dressCode.colourPalette?.length ? (
                  <ColourSwatches
                    colours={dressCode.colourPalette}
                    label="Suggested palette"
                    gold={theme.gold}
                  />
                ) : null}
                {dressCode.avoidColours?.length ? (
                  <ColourSwatches
                    colours={dressCode.avoidColours}
                    label="Please avoid"
                    gold={theme.gold}
                    strikethrough
                  />
                ) : null}
              </div>
            )}

            {/* Notes */}
            {dressCode.notes && (
              <div
                className="w-full flex items-center justify-start gap-2 px-3! py-2.5! rounded-xl"
                style={{
                  border: `1px solid ${theme.gold}20`,
                  background: `${theme.gold}08`,
                }}
              >
                <span style={{ color: theme.gold, fontSize: 10 }}>✦</span>
                <p
                  className="font-display italic font-semibold text-[13px] leading-relaxed"
                  style={{ color: `${theme.text}85` }}
                >
                  {dressCode.notes}
                </p>
              </div>
            )}
          </div>

          {/* Bottom perforated edge — like a real tag */}
          <div
            className="h-3 flex items-center justify-center gap-1.5"
            style={{ borderTop: `1px dashed ${theme.gold}20` }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{ width: 3, height: 3, background: `${theme.gold}20` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
