"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApi } from "@/hooks/useApi";

import type { Plan } from "@/lib/plans";
import { PRICING } from "@/lib/plans";

interface Props {
  currentPlan: Plan;
  hasStripeAccount: boolean;
}

const TIERS = [
  {
    plan: "free" as Plan,
    name: "Free",
    price: "$0",
    description: "Get started",
    features: [
      "1 wedding",
      "3 built-in themes",
      "Velvet curtain only",
      "20 RSVP limit",
      "Ceremonia watermark",
    ],
    cta: null,
  },
  {
    plan: "starter" as Plan,
    name: "Starter",
    price: "$9/mo",
    pricingMonthly: PRICING.starter.monthly,
    pricingOnce: PRICING.starter.once,
    description: "For couples",
    features: [
      "1 wedding",
      "All built-in themes",
      "Both curtain styles",
      "Custom audio",
      "Unlimited RSVPs",
      "No watermark",
    ],
    cta: "Get Starter",
  },
  {
    plan: "pro" as Plan,
    name: "Pro",
    price: "$19/mo",
    pricingMonthly: PRICING.pro.monthly,
    description: "For power users",
    features: [
      "Up to 5 weddings",
      "Custom theme builder",
      "Password protection",
      "Analytics dashboard",
      "CSV export",
      "Custom domain",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    plan: "agency" as Plan,
    name: "Agency",
    price: "$79/mo",
    pricingMonthly: PRICING.agency.monthly,
    description: "For planners",
    features: [
      "Unlimited weddings",
      "White-label",
      "Theme marketplace",
      "Client management",
      "API access",
    ],
    cta: "Get Agency",
  },
] as const;

export function BillingClient({ currentPlan, hasStripeAccount }: Props) {
  const api = useApi();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (
    priceId: string,
    mode: "subscription" | "payment",
  ) => {
    setLoading(priceId);
    try {
      const { data, error } = await api.api.billing.checkout.post({
        priceId,
        mode,
      });
      if (error || !data?.url) throw new Error("Checkout failed");
      router.push(data.url);
    } catch {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const { data, error } = await api.api.billing.portal.post({});
      if (error || !data?.url) throw new Error("Portal failed");
      router.push(data.url);
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <p
          className="font-label text-xs tracking-[0.5em] uppercase"
          style={{ color: "#D4AF3770" }}
        >
          Billing
        </p>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(28px,4vw,42px)", letterSpacing: "0.04em" }}
        >
          Plans & Pricing
        </h1>
        <p
          className="font-display italic"
          style={{ color: "#F5F0E850", fontSize: 16 }}
        >
          Current plan:{" "}
          <span style={{ color: "#D4AF37" }}>
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </span>
        </p>
      </div>

      {/* Manage subscription button */}
      {hasStripeAccount && currentPlan !== "free" && (
        <div className="mb-8">
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="font-label text-xs tracking-[0.4em] uppercase px-6 py-3 rounded-full border transition-all"
            style={{ borderColor: "#D4AF3740", color: "#D4AF3780" }}
          >
            {loading === "portal" ? "Redirecting…" : "Manage Subscription →"}
          </button>
        </div>
      )}

      {/* Pricing grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.plan === currentPlan;
          const isHighlighted = "highlighted" in tier && tier.highlighted;

          return (
            <div
              key={tier.plan}
              className="rounded-2xl p-7 flex flex-col gap-5 relative"
              style={{
                background: isHighlighted ? "#D4AF3710" : "#D4AF3705",
                border: `1px solid ${isCurrent ? "#D4AF37" : isHighlighted ? "#D4AF3740" : "#D4AF3718"}`,
              }}
            >
              {isCurrent && (
                <div
                  className="absolute top-4 right-4 font-label text-[9px] tracking-widest
                              uppercase px-2.5 py-1 rounded-full"
                  style={{ background: "#D4AF3720", color: "#D4AF37" }}
                >
                  Current
                </div>
              )}

              <div>
                <p
                  className="font-label text-xs tracking-widest uppercase mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  {tier.name}
                </p>
                <p
                  className="font-display font-light"
                  style={{ fontSize: 28, color: "#F5F0E8" }}
                >
                  {tier.price}
                </p>
                <p
                  className="font-display italic text-sm"
                  style={{ color: "#F5F0E850" }}
                >
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: "#D4AF37", flexShrink: 0 }}>✦</span>
                    <span
                      className="font-display italic text-sm"
                      style={{ color: "#F5F0E870" }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA buttons */}
              {tier.cta && !isCurrent && (
                <div className="flex flex-col gap-2">
                  {"pricingMonthly" in tier && tier.pricingMonthly && (
                    <button
                      onClick={() =>
                        handleCheckout(
                          tier.pricingMonthly!.priceId,
                          "subscription",
                        )
                      }
                      disabled={!!loading}
                      className="w-full py-3 rounded-xl font-label text-[10px] tracking-[0.3em]
                                uppercase transition-all border"
                      style={{
                        borderColor: "#D4AF3760",
                        color: "#D4AF37",
                        background: "#D4AF3715",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading === tier.pricingMonthly.priceId
                        ? "Redirecting…"
                        : tier.pricingMonthly.label}
                    </button>
                  )}
                  {"pricingOnce" in tier && tier.pricingOnce && (
                    <button
                      onClick={() =>
                        handleCheckout(tier.pricingOnce!.priceId, "payment")
                      }
                      disabled={!!loading}
                      className="w-full py-3 rounded-xl font-label text-[10px] tracking-[0.3em]
                                uppercase transition-all border"
                      style={{ borderColor: "#D4AF3720", color: "#D4AF3760" }}
                    >
                      {loading === tier.pricingOnce.priceId
                        ? "Redirecting…"
                        : tier.pricingOnce.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
