"use client";

import { useState, type ReactNode } from "react";

import { usePlan } from "@/hooks/usePlan";

import { useApi } from "@/hooks/useApi";
import { PLAN_ORDER, PRICING, type Plan } from "@/lib/plans";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import {
  ArrowRightIcon,
  Loader2Icon,
  LockIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

interface Props {
  requires: Plan;
  children: ReactNode;
  // Optional: custom label for what's being locked
  featureName?: string;
}

// Map each plan to the product ID that unlocks it
const PLAN_TO_PRODUCT_ID: Record<Exclude<Plan, "free">, string> = {
  starter: PRICING.starter.monthly.productId,
  pro: PRICING.pro.monthly.productId,
  agency: PRICING.agency.monthly.productId,
};

// All monthly product IDs — passed as allProducts so Polar shows the upgrade switcher
const ALL_MONTHLY = [
  PRICING.starter.monthly.productId,
  PRICING.pro.monthly.productId,
  PRICING.agency.monthly.productId,
];

// Helper — reverse-look up which plan a product ID belongs to
function getPlanFromProductId(id: string): Plan {
  if (
    id === PRICING.starter.monthly.productId ||
    id === PRICING.starter.once.productId
  )
    return "starter";
  if (id === PRICING.pro.monthly.productId) return "pro";
  if (id === PRICING.agency.monthly.productId) return "agency";
  return "free";
}

export function PlanGate({ requires, children, featureName }: Props) {
  const { can, plan: currentPlan } = usePlan();
  const { api } = useApi();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (can(requires)) return <>{children}</>;

  const handleUpgrade = async () => {
    if (requires === "free") return;
    setLoading(true);
    try {
      const productId = PLAN_TO_PRODUCT_ID[requires];
      // Pass all monthly products so Polar renders the plan switcher
      const allProducts = ALL_MONTHLY.filter(
        (id) =>
          PLAN_ORDER.indexOf(getPlanFromProductId(id)) >=
          PLAN_ORDER.indexOf(requires),
      );
      const { data, error } = await api.billing.checkout.post({
        productId,
        allProducts: allProducts.length ? allProducts : [productId],
      });
      if (error || !data?.url) throw new Error("Checkout failed");
      setOpen(false);
      await PolarEmbedCheckout.create(data.url, { theme: "dark" });
    } catch {
      // Fall back to billing page on error
      window.location.href = `/app/billing?autoOpen=${requires}_monthly`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Children rendered normally but visually locked */}
      <div
        className="relative cursor-pointer select-none"
        onClick={() => setOpen(true)}
      >
        <div style={{ opacity: 0.4, pointerEvents: "none" }}>{children}</div>
        <div className="absolute top-2 right-2 flex items-center justify-center">
          <span
            className="flex items-center gap-1.5 font-label text-[9px] tracking-widest uppercase px-2! py-1! rounded-full"
            style={{
              background: "#D4AF3720",
              color: "#D4AF37",
              border: "1px solid #D4AF3740",
            }}
          >
            <LockIcon className="size-2.5" />
            {requires.charAt(0).toUpperCase() + requires.slice(1)}
          </span>
        </div>
      </div>

      {/* Upgrade dialog */}
      {open && (
        <div
          className="fixed inset-0 z-999 flex items-center justify-center p-6!"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-8! flex flex-col items-center gap-5 text-center"
            style={{ background: "#0e0e0e", border: "1px solid #D4AF3730" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-[#D4AF3760] hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              <XIcon className="size-4" />
            </button>

            <div
              className="size-10 rounded-full flex items-center justify-center"
              style={{ background: "#D4AF3715", border: "1px solid #D4AF3730" }}
            >
              <SparklesIcon className="size-5" style={{ color: "#D4AF37" }} />
            </div>

            <div className="space-y-2">
              <p
                className="font-label text-xs tracking-[0.4em] uppercase"
                style={{ color: "#D4AF37" }}
              >
                {requires.charAt(0).toUpperCase() + requires.slice(1)} Plan
              </p>
              <p
                className="font-display italic text-lg"
                style={{ color: "#F5F0E8" }}
              >
                {featureName ?? "This feature"} requires the{" "}
                <span style={{ color: "#D4AF37" }}>{requires}</span> plan or
                above.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5! rounded-full font-label text-[11px] tracking-[0.3em] uppercase transition-all border cursor-pointer"
                style={{ borderColor: "#D4AF3750", color: "#D4AF3790" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 py-2.5! rounded-full font-label text-[11px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                style={{ background: "#D4AF37", color: "#080808" }}
              >
                {loading ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <>
                    Upgrade <ArrowRightIcon className="size-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
