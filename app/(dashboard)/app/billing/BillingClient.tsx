"use client";

import clsx from "clsx";
import { ArrowRightIcon, Loader2Icon, StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

import { useApi } from "@/hooks/useApi";
import type { Plan } from "@/lib/plans";
import { PRICING } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";

interface Props {
  currentPlan: Plan;
  hasStripeAccount: boolean;
  paymentSuccess?: boolean;
  paymentCancelled?: boolean;
}

const TIERS = [
  {
    plan: "free" as Plan,
    name: "Free",
    price: "$0",
    description: "Get started",
    features: [
      "1 event",
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
      "1 event",
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
      "Up to 5 events",
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
      "Unlimited events",
      "White-label",
      "Theme marketplace",
      "Client management",
      "API access",
    ],
    cta: "Get Agency",
  },
] as const;

export function BillingClient({
  currentPlan,
  hasStripeAccount,
  paymentSuccess,
  paymentCancelled,
}: Props) {
  const { api } = useApi();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<Plan>(currentPlan);
  const [syncing, setSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When Stripe redirects back with ?success=true, poll Clerk's session
  // until the plan in publicMetadata has updated (webhook will have fired)
  useEffect(() => {
    if (!paymentSuccess) return;

    setSyncing(true);

    pollRef.current = setInterval(async () => {
      await user?.reload();
      const updatedPlan =
        (user?.publicMetadata?.plan as Plan | undefined) ?? "free";

      if (updatedPlan !== currentPlan) {
        setActivePlan(updatedPlan);
        setSyncing(false);
        clearInterval(pollRef.current!);
        // Clean up the URL
        router.replace("/app/billing");
      }
    }, 1500);

    // Stop polling after 30s regardless
    const timeout = setTimeout(() => {
      clearInterval(pollRef.current!);
      setSyncing(false);
    }, 30_000);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(timeout);
    };
  }, [paymentSuccess]);

  const handleCheckout = async (
    priceId: string,
    mode: "subscription" | "payment",
  ) => {
    setLoading(priceId);
    const tier = TIERS.find(
      (t) =>
        ("pricingMonthly" in t && t.pricingMonthly?.priceId === priceId) ||
        ("pricingOnce" in t && t.pricingOnce?.priceId === priceId),
    );
    posthog.capture("checkout_initiated", {
      price_id: priceId,
      mode,
      plan: tier?.plan ?? "unknown",
      current_plan: activePlan,
    });
    try {
      const { data, error } = await api.billing.checkout.post({
        priceId,
        mode,
      });
      if (error || !data?.url) throw new Error("Checkout failed");
      router.push(data.url);
    } catch (err) {
      posthog.captureException(err, { event_name: "checkout_failed" });
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    posthog.capture("billing_portal_opened", { current_plan: activePlan });
    try {
      const { data, error } = await api.billing.portal.post({});
      if (error || !data?.url) throw new Error("Portal failed");
      router.push(data.url);
    } catch (err) {
      posthog.captureException(err, { event_name: "billing_portal_failed" });
      setLoading(null);
    }
  };

  return (
    <div className="w-full p-10! mx-auto">
      {/* ── Success banner ── */}
      {paymentSuccess && (
        <div className="mb-8! rounded-xl border border-[#D4AF3740] bg-[#D4AF3710] px-6! py-4! flex items-center gap-4">
          {syncing ? (
            <>
              <Loader2Icon className="size-4 text-dash-gold animate-spin shrink-0" />
              <div>
                <p className="font-label font-semibold! text-[11px] tracking-[0.4em] uppercase text-dash-gold">
                  Activating your plan…
                </p>
                <p className="font-display italic text-sm font-semibold! text-dash-text/60 mt-0.5">
                  This usually takes a few seconds
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-dash-gold text-xl">✦</span>
              <div>
                <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-gold">
                  Payment successful
                </p>
                <p className="font-display italic text-sm text-dash-text/60 mt-0.5">
                  Your plan has been upgraded to{" "}
                  <span className="text-dash-gold capitalize">
                    {activePlan}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Cancelled banner ── */}
      {paymentCancelled && (
        <div className="mb-8 rounded-xl border border-[#ffffff15] bg-[#ffffff05] px-6 py-4">
          <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-text/50">
            Payment cancelled — no charge was made
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-10 space-y-2">
        <p className="font-label text-sm font-semibold tracking-[0.5em] uppercase text-dash-gold/70">
          Billing
        </p>
        <h1 className="font-display font-light text-[clamp(28px,4vw,42px)] tracking-[0.04em] text-dash-text">
          Plans & Pricing
        </h1>
        <p className="font-display italic font-semibold text-base text-dash-text/50 mb-6!">
          Current plan:{" "}
          <span className="text-dash-gold">
            {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)}
          </span>
        </p>
      </div>

      {/* ── Manage subscription ── */}
      {hasStripeAccount && currentPlan !== "free" && (
        <div className="mb-8!">
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="flex items-center gap-2 font-label text-sm font-bold tracking-[0.4em] uppercase px-6! py-3! rounded-full border border-dash-border-md text-dash-gold/80 transition-all hover:text-dash-gold hover:border-dash-border-hi disabled:opacity-50"
          >
            {loading === "portal" ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                Manage Subscription <ArrowRightIcon className="size-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Pricing grid ── */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.plan === activePlan;
          const isHighlighted = "highlighted" in tier && tier.highlighted;

          return (
            <div
              key={tier.plan}
              className={clsx(
                "rounded-2xl p-7! flex flex-col gap-5 relative",
                isHighlighted
                  ? "bg-dash-gold/6 border border-dash-border-md"
                  : "bg-dash-gold/2 border border-dash-border",
                isCurrent && "border-dash-gold",
              )}
            >
              {/* Current badge */}
              {isCurrent && (
                <div
                  className="absolute top-4 right-4 font-label font-semibold text-[9px] tracking-widest
                                uppercase px-2.5! py-1! rounded-full
                                bg-dash-gold/10 text-dash-gold"
                >
                  Current
                </div>
              )}

              {/* Plan header */}
              <div className="space-y-0.5 font-semibold">
                <p
                  data-tier-id={tier.name.toLowerCase()}
                  className="font-label text-sm tracking-widest uppercase text-dash-gold"
                >
                  {tier.name}
                </p>
                <p className="font-display font-light text-[28px] text-dash-text">
                  {tier.price}
                </p>
                <p className="font-display italic text-dash-text/50">
                  {tier.description}
                </p>
              </div>

              {/* Feature list */}
              <ul className="space-y-2! flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <StarIcon className="size-3 text-dash-gold fill-dash-gold shrink-0 mt-0.5" />
                    <span className="font-display italic text-dash-text/70">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
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
                      className="flex items-center justify-center gap-1.5 w-full py-2! rounded-xl font-label text-[14px] tracking-[0.3em] uppercase transition-all border border-dash-border-hi text-dash-gold bg-dash-gold/8 hover:bg-dash-gold/[0.14] disabled:opacity-50 cursor-pointer"
                    >
                      {loading === tier.pricingMonthly.priceId ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />{" "}
                          Redirecting…
                        </>
                      ) : (
                        tier.pricingMonthly.label
                      )}
                    </button>
                  )}
                  {"pricingOnce" in tier && tier.pricingOnce && (
                    <button
                      onClick={() =>
                        handleCheckout(tier.pricingOnce!.priceId, "payment")
                      }
                      disabled={!!loading}
                      className="flex items-center justify-center gap-1.5 w-full py-2! rounded-xl font-label text-[14px] tracking-[0.3em] uppercase transition-all border border-dash-border text-dash-gold/60 hover:text-dash-gold hover:border-dash-border-md disabled:opacity-50 cursor-pointer"
                    >
                      {loading === tier.pricingOnce.priceId ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />{" "}
                          Redirecting…
                        </>
                      ) : (
                        tier.pricingOnce.label
                      )}
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
