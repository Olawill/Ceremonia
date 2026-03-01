"use client";

import { PaletteIcon } from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/lib/ThemeContext";
import { themes } from "@/themes";
import type { ThemeKey } from "@/types/theme";

interface Props {
  curtainStyle: "velvet" | "drape";
  onCurtainChange: (s: "velvet" | "drape") => void;
}

export function ThemeSelector({ curtainStyle, onCurtainChange }: Props) {
  const { themeKey, theme, setThemeKey } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-5 right-5 z-300">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-label text-[11px] tracking-[0.3em] px-8 py-4 rounded-full border
                backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center gap-2"
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
          {(Object.keys(themes) as ThemeKey[]).map((key) => {
            const t = themes[key];
            return (
              <button
                key={key}
                onClick={() => {
                  setThemeKey(key);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full p-3.5 rounded-lg
                          font-label text-[13px] tracking-[0.2em] cursor-pointer
                          border-0 text-left transition-all duration-200"
                style={{
                  background: themeKey === key ? `${t.gold}20` : "transparent",
                  color: t.gold,
                  paddingBlock: "4px",
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border-2"
                  style={{ background: t.curtain, borderColor: t.gold }}
                />
                {t.name}
              </button>
            );
          })}

          {/* Divider */}
          <div
            className="my-2 h-px"
            style={{ background: `${themes[themeKey].gold}20` }}
          />

          <p
            className="font-label text-[11px] font-bold tracking-[0.4em] px-3.5 py-1"
            style={{ color: `${themes[themeKey].gold}50` }}
          >
            CURTAIN STYLE
          </p>

          {(["velvet", "drape"] as const).map((style) => (
            <button
              key={style}
              onClick={() => {
                onCurtainChange(style);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3.5 py-3.5 rounded-lg
              font-label text-[11px] tracking-[0.2em] cursor-pointer
              border-0 text-left transition-all duration-200"
              style={{
                background:
                  curtainStyle === style
                    ? `${themes[themeKey].gold}20`
                    : "transparent",
                color: themes[themeKey].gold,
              }}
            >
              <span className="text-base">
                {style === "velvet" ? "🎭" : "🪢"}
              </span>
              {style === "velvet" ? "Velvet Panels" : "Draped Swags"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
