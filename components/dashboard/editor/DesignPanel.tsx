"use client";

import clsx from "clsx";

import { ThemeCustomiser } from "@/components/dashboard/editor/ThemeCustomiser";
import { PlanGate } from "@/components/ui/PlanGate";

import { usePlan } from "@/hooks/usePlan";

import { themes } from "@/themes";

import { useApi } from "@/hooks/useApi";
import { Plan, planMeetsRequirement } from "@/lib/plans";
import type { EntryStyle, EventConfig, NavMode } from "@/types/event";
import type { ThemeKey } from "@/types/theme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
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

const entryStyles = [
  {
    label: "curtain" as EntryStyle,
    name: "Curtain",
    emoji: "🎭",
    plan: "free" as const,
  },
  {
    label: "envelope" as EntryStyle,
    name: "Envelope",
    emoji: "✉️",
    plan: "pro" as const,
  },
] as const;

const navModes = [
  {
    label: "scroll" as NavMode,
    name: "Classic Scroll",
    emoji: "📜",
    plan: "free" as const,
  },
  {
    label: "rooms" as NavMode,
    name: "3D Rooms",
    emoji: "🏛️",
    plan: "agency" as const,
  },
] as const;

export function DesignPanel({ config, onChange, previewIframeRef }: Props) {
  const { features, plan: ownerPlan } = usePlan();

  return (
    <div className="space-y-6!">
      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        Theme
      </p>

      <div className="grid grid-cols-3 gap-3!">
        {(Object.keys(themes) as Exclude<ThemeKey, "custom">[])
          .filter((_, i) => features.allBuiltInThemes || i < 3)
          .map((key) => {
            const t = themes[key];
            const active = !config.customTheme && config.themeKey === key;
            return (
              <button
                key={key}
                onClick={() =>
                  onChange({ themeKey: key, customTheme: undefined })
                }
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

      {/* ── Entry Experience ── */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF3730, transparent)",
        }}
      />

      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        Entry Experience
      </p>

      <div className="grid grid-cols-2 gap-3!">
        {entryStyles.map(({ label, name, emoji, plan }) => {
          const active = (config.entryStyle ?? "curtain") === label;
          const locked =
            plan !== "free" ? !planMeetsRequirement(ownerPlan, plan) : false;
          const btn = (
            <button
              key={label}
              onClick={() => {
                if (locked) return;
                onChange({ entryStyle: label });
              }}
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
              featureName={`${name} entry experience`}
            >
              {btn}
            </PlanGate>
          );
        })}
      </div>

      {/* ── Content Navigation ── */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF3730, transparent)",
        }}
      />

      <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
        Content Navigation
      </p>

      <div className="grid grid-cols-2 gap-3!">
        {navModes.map(({ label, name, emoji, plan }) => {
          const active = (config.navMode ?? "scroll") === label;
          const locked =
            plan !== "free" ? !planMeetsRequirement(ownerPlan, plan) : false;
          const btn = (
            <button
              key={label}
              onClick={() => {
                if (locked) return;
                onChange({ navMode: label });
              }}
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
              featureName={`${name} navigation`}
            >
              {btn}
            </PlanGate>
          );
        })}
      </div>

      {/* Rooms credits info — shown when rooms mode is active */}
      {config.navMode === "rooms" && <RoomsCreditsInfo ownerPlan={ownerPlan} />}

      {(config.entryStyle ?? "curtain") === "curtain" && (
        <>
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
                plan !== "free"
                  ? !planMeetsRequirement(ownerPlan, plan)
                  : false;
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
        </>
      )}

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
          entryStyle={config.entryStyle ?? "curtain"}
        />
      </PlanGate>
    </div>
  );
}

function RoomsCreditsInfo({ ownerPlan }: { ownerPlan: Plan }) {
  const { api } = useApi();
  const router = useRouter();
  const [credits, setCredits] = useState<{
    total: number;
    used: number;
  } | null>(null);

  useEffect(() => {
    api.rooms.credits.get({}).then(({ data, error }) => {
      if (data && !error) setCredits({ total: data.total, used: data.used });
    });
  }, []);

  const remaining = credits ? credits.total - credits.used : null;

  return (
    <div
      className="rounded-xl p-4! text-[11px] font-label tracking-wide"
      style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
    >
      <p style={{ color: "#D4AF3790" }}>
        {ownerPlan === "agency"
          ? "Agency plan includes 3 free activations/month."
          : "3D Rooms is available as a paid add-on."}
      </p>
      {credits !== null && (
        <p className="mt-1" style={{ color: "#D4AF37" }}>
          Credits remaining: <strong>{remaining}</strong>
        </p>
      )}
      <button
        onClick={() => router.push("/app/billing?addOn=rooms")}
        className="mt-3 w-full py-2! rounded-lg font-bold tracking-[0.3em] uppercase transition-all cursor-pointer"
        style={{
          background: "#D4AF3715",
          border: "1px solid #D4AF3740",
          color: "#D4AF37",
          fontSize: 10,
        }}
      >
        Buy Credits
      </button>
    </div>
  );
}
