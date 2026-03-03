"use client";

import { ThemeCustomiser } from "@/components/dashboard/editor/ThemeCustomiser";
import { PlanGate } from "@/components/ui/PlanGate";

import { usePlan } from "@/hooks/usePlan";

import { themes } from "@/themes";

import type { ThemeKey } from "@/types/theme";
import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const curtainStyles = [
  { label: "velvet", isFree: true },
  { isFree: false, label: "drape" },
] as const;

export function DesignPanel({ config, onChange, previewIframeRef }: Props) {
  const { features } = usePlan();

  return (
    <div className="space-y-6!">
      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        Theme
      </p>

      <div className="grid grid-cols-3 gap-3!">
        {(Object.keys(themes) as ThemeKey[])
          .filter((_, i) => features.allBuiltInThemes || i < 3)
          .map((key) => {
            const t = themes[key];
            const active = config.themeKey === key;
            return (
              <button
                key={key}
                onClick={() => onChange({ themeKey: key })}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: active ? t.gold : "#D4AF3720",
                  background: active ? `${t.gold}10` : "#D4AF3705",
                }}
              >
                {/* Swatch */}
                <div
                  className="w-full h-10 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${t.curtain}, ${t.bg})`,
                  }}
                />
                <span
                  className="font-label text-[11px] tracking-widest uppercase"
                  style={{ color: t.gold }}
                >
                  {t.name}
                </span>
              </button>
            );
          })}
      </div>

      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF3730, transparent)",
        }}
      />

      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        Curtain Style
      </p>

      <div className="grid grid-cols-2 gap-3">
        {curtainStyles.map(({ label, isFree }) => {
          if (!isFree) {
            return (
              <PlanGate
                key={label}
                requires="starter"
                featureName="Draped curtain style"
              >
                <button
                  onClick={() => onChange({ curtainStyle: label })}
                  className="py-4! rounded-xl border font-label text-[12px] font-bold! tracking-widest
                      uppercase transition-all"
                  style={{
                    borderColor:
                      config.curtainStyle === label ? "#D4AF3790" : "#D4AF3760",
                    color:
                      config.curtainStyle === label ? "#D4AF37" : "#D4AF3780",
                    background:
                      config.curtainStyle === label
                        ? "#D4AF3710"
                        : "transparent",
                  }}
                >
                  {"🪢 Draped"}
                </button>
              </PlanGate>
            );
          }

          return (
            <button
              key={label}
              onClick={() => onChange({ curtainStyle: label })}
              className="py-4! rounded-xl border font-label text-[12px] font-bold! tracking-widest
                      uppercase transition-all"
              style={{
                borderColor:
                  config.curtainStyle === label ? "#D4AF3790" : "#D4AF3760",
                color: config.curtainStyle === label ? "#D4AF37" : "#D4AF3780",
                background:
                  config.curtainStyle === label ? "#D4AF3710" : "transparent",
              }}
            >
              {label === "velvet" ? "🎭 Velvet" : "🪢 Draped"}
            </button>
          );
        })}
      </div>

      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF3730, transparent)",
        }}
      />

      <PlanGate requires="pro" featureName="Custom theme builder">
        <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
          Custom Theme
        </p>
        <ThemeCustomiser
          config={config}
          onChange={onChange}
          previewIframeRef={previewIframeRef}
        />
      </PlanGate>
    </div>
  );
}
