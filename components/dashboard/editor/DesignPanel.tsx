"use client";

import clsx from "clsx";

import { ThemeCustomiser } from "@/components/dashboard/editor/ThemeCustomiser";
import { PlanGate } from "@/components/ui/PlanGate";

import { usePlan } from "@/hooks/usePlan";
import { planMeetsRequirement } from "@/lib/plans";

import { themes } from "@/themes";

import type { ThemeKey } from "@/types/theme";
import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const curtainStyles = [
  { label: "velvet", plan: "free", name: "Velvet", emoji: "🎭" },
  { label: "drape", plan: "starter", name: "Draped", emoji: "🪢" },
  { label: "sheer", plan: "pro", name: "Sheer", emoji: "🕊️" },
  { label: "cascade", plan: "pro", name: "Cascade", emoji: "🌊" },
  { label: "iris", plan: "pro", name: "Iris", emoji: "🌸" },
  { label: "split", plan: "starter", name: "Split", emoji: "✂️" },
  { label: "veil", plan: "starter", name: "Veil", emoji: "🤍" },
] as const;

export function DesignPanel({ config, onChange, previewIframeRef }: Props) {
  const { features, plan: ownerPlan } = usePlan();

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

      <div className="grid grid-cols-2 gap-3!">
        {curtainStyles.map(({ label, name, plan, emoji }) => {
          const active = config.curtainStyle === label;

          const locked =
            plan !== "free" ? !planMeetsRequirement(ownerPlan, plan) : false;
          const btn = (
            <button
              key={label}
              onClick={() => !locked && onChange({ curtainStyle: label })}
              className={clsx(
                "py-3! rounded-xl border font-label text-[12px] font-bold! tracking-widest uppercase transition-all w-full",
                active
                  ? "border-[#D4AF3790] text-[#D4AF37] bg-[#D4AF3710]"
                  : "border-[#D4AF3740] text-[#D4AF3770] bg-transparent",
                locked ? "cursor-default" : "cursor-pointer",
              )}
            >
              {emoji} {name}
            </button>
          );

          if (!locked) return btn;

          return (
            <PlanGate
              key={label}
              requires={plan}
              featureName={`${name} curtain style`}
            >
              {btn}
            </PlanGate>
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
          ownerPlan={ownerPlan}
        />
      </PlanGate>
    </div>
  );
}
