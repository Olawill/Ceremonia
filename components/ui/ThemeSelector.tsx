"use client";

import { LockIcon, PaletteIcon } from "lucide-react";
import { useState } from "react";

import { Plan, PLAN_FEATURES } from "@/lib/plans";
import { useTheme } from "@/lib/ThemeContext";
import { themes } from "@/themes";
import type { ThemeKey } from "@/types/theme";

interface Props {
  curtainStyle: "velvet" | "drape";
  onCurtainChange: (s: "velvet" | "drape") => void;
  ownerPlan?: Plan;
}

export function ThemeSelector({
  curtainStyle,
  onCurtainChange,
  ownerPlan = "free",
}: Props) {
  const { themeKey, theme, setThemeKey } = useTheme();
  const [open, setOpen] = useState(false);

  const features = PLAN_FEATURES[ownerPlan];

  // Which theme keys are accessible on this plan
  const allThemeKeys = Object.keys(themes) as ThemeKey[];
  // Free plan: only first theme selectable, rest shown but locked
  // Starter+: all themes
  const canUseAllThemes = features.allBuiltInThemes;
  const canUseDrape = features.bothCurtainStyles;

  return (
    <div className="fixed top-5 right-5 z-300">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-label text-[11px] tracking-[0.3em] px-8 py-4 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center gap-2"
        style={{
          borderColor: `${theme.gold}60`,
          background: `${theme.bg}CC`,
          color: theme.gold,
          padding: "8px",
        }}
      >
        <PaletteIcon className="size-4" /> THEME
      </button>

      {open && (
        <div
          className="absolute top-11 right-0 p-2 rounded-xl min-w-[180px] border backdrop-blur-xl flex flex-col gap-2"
          style={{
            background: `${theme.bg}F0`,
            borderColor: `${theme.gold}40`,
            padding: "8px",
          }}
        >
          {/* ── Themes section ── */}
          <p className="font-label text-[10px] text-[#D4AF37] font-bold tracking-[0.4em] px-3.5 pt-3 pb-1">
            THEME
          </p>

          {allThemeKeys.map((key, i) => {
            const t = themes[key];
            const locked = !canUseAllThemes && i > 0;
            const active = themeKey === key;

            return (
              <button
                key={key}
                onClick={() => {
                  if (locked) return;
                  setThemeKey(key);
                  setOpen(false);
                }}
                disabled={locked}
                className="flex items-center gap-2.5 w-full px-3.5! py-1.5! font-label text-[11px] tracking-[0.2em] text-left transition-all duration-200 border-0"
                style={{
                  background: active ? `${t.gold}20` : "transparent",
                  color: locked ? `${t.gold}85` : t.gold,
                  cursor: locked ? "default" : "pointer",
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border-2"
                  style={{
                    background: t.curtain,
                    borderColor: locked ? `${t.gold}30` : t.gold,
                  }}
                />
                <span className="flex-1">{t.name}</span>
                {locked && (
                  <span
                    className="flex items-center gap-1 font-label text-[9px] tracking-widest uppercase px-1.5! py-0.5! rounded-full"
                    style={{
                      background: `${t.gold}15`,
                      color: `${t.gold}80`,
                    }}
                  >
                    <LockIcon className="size-2.5" />
                    Starter
                  </span>
                )}
              </button>
            );
          })}

          {/* ── Divider ── */}
          <div
            className="mx-3 my-2 h-px"
            style={{ background: `${themes[themeKey].gold}20` }}
          />

          {/* ── Curtain style section ── */}
          <p className="font-label text-[10px] text-[#D4AF37] font-bold tracking-[0.4em] px-3.5 pb-1">
            CURTAIN STYLE
          </p>

          {(
            [
              {
                style: "velvet",
                label: "Velvet Panels",
                emoji: "🎭",
                locked: false,
              },
              {
                style: "drape",
                label: "Draped Swags",
                emoji: "🪢",
                locked: !canUseDrape,
              },
            ] as const
          ).map(({ style, label, emoji, locked }) => (
            <button
              key={style}
              onClick={() => {
                if (locked) return;
                onCurtainChange(style);
                setOpen(false);
              }}
              disabled={locked}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 font-label text-[11px] tracking-[0.2em] text-left transition-all duration-200 border-0"
              style={{
                background:
                  curtainStyle === style && !locked
                    ? `${themes[themeKey].gold}20`
                    : "transparent",
                color: locked
                  ? `${themes[themeKey].gold}85`
                  : themes[themeKey].gold,
                cursor: locked ? "default" : "pointer",
              }}
            >
              <span className="text-base">{emoji}</span>
              <span className="flex-1">{label}</span>
              {locked && (
                <span
                  className="flex items-center gap-1 font-label text-[9px] tracking-widest not-first:uppercase px-1.5! py-0.5! rounded-full"
                  style={{
                    background: `${themes[themeKey].gold}15`,
                    color: `${themes[themeKey].gold}80`,
                  }}
                >
                  <LockIcon className="size-2.5" />
                  Starter
                </span>
              )}
            </button>
          ))}

          <div className="pb-1" />
        </div>
      )}
    </div>
  );
}
