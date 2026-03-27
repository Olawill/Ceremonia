"use client";

import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import clsx from "clsx";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeCustomiser } from "@/components/dashboard/editor/ThemeCustomiser";
import { PlanGate } from "@/components/ui/PlanGate";

import { useApi } from "@/hooks/useApi";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/hooks/useToast";
import { Plan, planMeetsRequirement } from "@/lib/plans";
import { themes } from "@/themes";
import type { EntryStyle, EventConfig, NavMode } from "@/types/event";
import type { ThemeKey } from "@/types/theme";
import { toast } from "sonner";

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
  const { api } = useApi();
  const { handleApiError } = useToast();

  // null = not yet checked, true = has credits, false = no credits
  const [roomsAvailable, setRoomsAvailable] = useState<boolean | null>(null);
  const [checkingRooms, setCheckingRooms] = useState(false);

  const handleNavModeChange = async (label: NavMode) => {
    if (label !== "rooms") {
      onChange({ navMode: label });
      return;
    }

    // For rooms: check credits before applying
    setCheckingRooms(true);
    try {
      const { data, error } = await api.rooms.credits.get({});
      if (error || !data) {
        handleApiError(error);
        return;
      }

      const remaining = data.total - data.used;
      if (remaining > 0) {
        setRoomsAvailable(true);
        onChange({ navMode: "rooms" });
      } else {
        setRoomsAvailable(false);
        // Don't apply — leave navMode as scroll, show the credits widget
        // so the user can buy credits before activating
        onChange({ navMode: "scroll" });
      }
    } catch {
      setRoomsAvailable(false);
      onChange({ navMode: "scroll" });
    } finally {
      setCheckingRooms(false);
    }
  };

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
          const isRooms = label === "rooms";
          const isLoading = isRooms && checkingRooms;

          // For rooms: all plans can activate it (they just need credits).
          // Agency gets it free in-plan; others buy credits.
          // So we don't gate rooms behind PlanGate — we let anyone click it,
          // and the RoomsCreditsInfo widget handles the purchase flow.
          const btn = (
            <button
              key={label}
              onClick={() => handleNavModeChange(label)}
              className={clsx(
                "py-3! rounded-xl border font-label text-[12px] font-bold! tracking-widest uppercase transition-all w-full",
                active
                  ? "border-[#D4AF3790] text-[#D4AF37] bg-[#D4AF3710]"
                  : "border-[#D4AF3740] text-[#D4AF3770] bg-transparent",
                isLoading ? "cursor-wait opacity-60" : "cursor-pointer",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2Icon className="size-3 animate-spin" />
                  Checking…
                </span>
              ) : (
                <>
                  {emoji} {name}
                </>
              )}
            </button>
          );

          return btn;
        })}
      </div>

      {/* Rooms credits info — shown when rooms mode is active */}
      {(config.navMode === "rooms" || roomsAvailable === false) && (
        <RoomsCreditsInfo
          ownerPlan={ownerPlan}
          onCreditsPurchased={() => {
            setRoomsAvailable(true);
            onChange({ navMode: "rooms" });
          }}
        />
      )}

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

function RoomsCreditsInfo({
  ownerPlan,
  onCreditsPurchased,
}: {
  ownerPlan: Plan;
  onCreditsPurchased?: () => void;
}) {
  const { api } = useApi();
  const router = useRouter();
  const [credits, setCredits] = useState<{
    total: number;
    used: number;
  } | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.rooms.credits.get({}).then(({ data, error }) => {
      if (data && !error) setCredits({ total: data.total, used: data.used });
    });
  }, []);

  const remaining = credits ? credits.total - credits.used : null;

  const handleBuyCredits = async () => {
    setBuying(true);
    try {
      const { data, error } = await api.rooms.credits.checkout.post({});
      if (error || !data?.url) {
        toast.error("Checkout failed");
        return;
      }

      const checkout = await PolarEmbedCheckout.create(data.url, {
        theme: "dark",
      });
      checkout.addEventListener("success", () => {
        onCreditsPurchased?.();
      });
    } catch {
      router.push("/app/billing");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4! text-[11px] font-label tracking-wide space-y-3!"
      style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
    >
      <p className="font-semibold" style={{ color: "#D4AF3790" }}>
        {ownerPlan === "agency"
          ? "Agency includes 3 free activations/month."
          : "3D Rooms is an add-on available to all plans."}
      </p>
      {credits !== null && (
        <div className="space-y-1!">
          <p className="font-semibold" style={{ color: "#D4AF37" }}>
            Credits remaining: <strong>{remaining}</strong>
          </p>
          {ownerPlan === "agency" && (
            <p style={{ color: "#D4AF3780", fontSize: 10 }}>
              Free credits reset monthly · Purchased credits never expire
            </p>
          )}
        </div>
      )}
      <button
        onClick={handleBuyCredits}
        disabled={buying}
        className="w-full py-2! rounded-lg font-bold tracking-[0.3em] uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        style={{
          background: "#D4AF3715",
          border: "1px solid #D4AF3740",
          color: "#D4AF37",
          fontSize: 10,
        }}
      >
        {buying ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          "Buy 5 Credits — $19"
        )}
      </button>
    </div>
  );
}
