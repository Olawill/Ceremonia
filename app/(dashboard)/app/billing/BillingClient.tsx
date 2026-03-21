"use client";

import { useUser } from "@clerk/nextjs";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import clsx from "clsx";
import { ArrowRightIcon, Loader2Icon, StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

import { useApi } from "@/hooks/useApi";

import type { Plan } from "@/lib/plans";
import { PLAN_ORDER, PRICING } from "@/lib/plans";

interface Props {
  currentPlan: Plan;
  hasPolarAccount: boolean;
  hasEverPaid: boolean;
  paymentSuccess?: boolean;
  paymentCancelled?: boolean;
  successProductId?: string;
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

// All paid product IDs in ascending order
const ALL_MONTHLY_PRODUCT_IDS = [
  PRICING.starter.monthly.productId,
  PRICING.pro.monthly.productId,
  PRICING.agency.monthly.productId,
];

// When the one-time option is clicked, include it alongside monthly alternatives
// so the user can see both and switch if they prefer monthly
const ALL_WITH_ONCE_PRODUCT_IDS = [
  PRICING.starter.once.productId, // preselected (first = default in Polar)
  PRICING.starter.monthly.productId, // they can switch to monthly
  PRICING.pro.monthly.productId,
  PRICING.agency.monthly.productId,
];

const TIER_CAVEATS: Record<
  string,
  { monthly: string[]; once: string[]; downgrade: string[] }
> = {
  starter: {
    monthly: [
      "1 active event at a time",
      "Hosted as long as subscription is active",
      "New themes included as we release them",
      "RSVP email notifications included",
    ],
    once: [
      "1 active event — no renewal needed",
      "Hosted for 365 days from purchase date",
      "Themes locked to those available today — future themes not included",
      "No RSVP email notifications — check your dashboard for RSVPs",
      "Pay once, no recurring charges",
    ],
    downgrade: [
      "Custom theme builder access will be removed",
      "Password-protected events will become accessible to anyone",
      "Analytics dashboard will no longer be available",
      "CSV RSVP export will be disabled",
      "Custom domain will stop resolving — event moves back to ceremonia.app subdomain",
      "You will be limited to 1 active event",
    ],
  },
  pro: {
    monthly: [
      "Up to 5 active events simultaneously",
      "Hosted as long as subscription is active",
      "Includes everything in Starter",
    ],
    once: [],
    downgrade: [
      "White-label branding will be removed — Ceremonia branding will reappear",
      "You will be limited to 5 active events",
      "Theme marketplace access will be removed",
      "API access will be disabled",
    ],
  },
  agency: {
    monthly: [
      "Unlimited active events",
      "Hosted as long as subscription is active",
      "Includes everything in Pro",
      "White-label removes all Ceremonia branding",
    ],
    once: [],
    downgrade: [], // Can't downgrade to agency — it's the top tier
  },
};

export function BillingClient({
  currentPlan,
  hasPolarAccount,
  hasEverPaid,
  paymentSuccess,
  paymentCancelled,
  successProductId,
}: Props) {
  const { api } = useApi();
  const router = useRouter();
  const { user } = useUser();
  const [redirectingFor, setRedirectingFor] = useState<
    "checkout" | "portal" | null
  >(null);
  const redirecting = redirectingFor !== null;

  const [pendingCheckout, setPendingCheckout] = useState<{
    productId: string;
    allProducts: string[];
    tierName: string;
    tierPlan: Plan;
    features: readonly string[];
    billing: "monthly" | "once";
    caveats: string[];
    intent: "upgrade" | "downgrade";
  } | null>(null);

  const [activePlan, setActivePlan] = useState<Plan>(currentPlan);
  const [syncing, setSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When Polar redirects back with ?success=true, poll Clerk's session
  // until the plan in publicMetadata has updated (webhook will have fired)
  useEffect(() => {
    if (!paymentSuccess) return;

    // Derive which plan was purchased from the priceId in the redirect URL
    const purchasedPlan: Plan | null = successProductId
      ? (() => {
          if (
            successProductId === PRICING.starter.monthly.productId ||
            successProductId === PRICING.starter.once.productId
          )
            return "starter";
          if (successProductId === PRICING.pro.monthly.productId) return "pro";
          if (successProductId === PRICING.agency.monthly.productId)
            return "agency";
          return null;
        })()
      : null;

    // Optimistically apply the plan immediately — don't wait for the webhook
    if (purchasedPlan) {
      setActivePlan(purchasedPlan);
    }

    setSyncing(true);

    pollRef.current = setInterval(async () => {
      await user?.reload();
      const updatedPlan =
        (user?.publicMetadata?.plan as Plan | undefined) ?? "free";

      // Stop polling once Clerk confirms a plan upgrade
      const isUpgraded =
        PLAN_ORDER.indexOf(updatedPlan) > PLAN_ORDER.indexOf(currentPlan);

      if (isUpgraded || updatedPlan === purchasedPlan) {
        setActivePlan(updatedPlan);
        setSyncing(false);
        clearInterval(pollRef.current!);
        router.replace("/app/billing");
      }
    }, 1500);

    const timeout = setTimeout(() => {
      clearInterval(pollRef.current!);
      setSyncing(false);
    }, 30_000);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(timeout);
    };
  }, [paymentSuccess, successProductId]);

  // Auto-open checkout if redirected from marketing page with a plan hint
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoOpen = params.get("autoOpen");
    if (!autoOpen) return;

    const productMap: Record<string, string> = {
      starter_monthly: PRICING.starter.monthly.productId,
      pro_monthly: PRICING.pro.monthly.productId,
      agency_monthly: PRICING.agency.monthly.productId,
    };

    const productId = productMap[autoOpen];
    if (!productId) return;

    // Small delay to let the page render before opening the embed
    const t = setTimeout(() => {
      handleCheckout(productId, ALL_MONTHLY_PRODUCT_IDS);
    }, 400);

    return () => clearTimeout(t);
  }, []); // only on mount

  const handleCheckout = async (productId: string, allProducts?: string[]) => {
    setRedirectingFor("checkout");

    posthog.capture("checkout_initiated", {
      product_id: productId,
      current_plan: activePlan,
    });
    try {
      const { data, error } = await api.billing.checkout.post({
        productId,
        allProducts,
      });

      if (error || !data?.url) throw new Error("Checkout failed");

      if (typeof window === "undefined") return;

      const checkout = await PolarEmbedCheckout.create(data.url, {
        theme: "dark",
        onLoaded: () => setRedirectingFor(null),
      });

      checkout.addEventListener("success", () => {
        // Trigger the existing Clerk polling loop
        setSyncing(true);

        // Safety net — stop polling after 30s regardless
        const timeoutId = setTimeout(() => {
          clearInterval(pollRef.current!);
          setSyncing(false);
        }, 30_000);

        pollRef.current = setInterval(async () => {
          await user?.reload();
          const updatedPlan =
            (user?.publicMetadata?.plan as Plan | undefined) ?? "free";
          const isUpgraded =
            PLAN_ORDER.indexOf(updatedPlan) > PLAN_ORDER.indexOf(currentPlan);
          if (isUpgraded) {
            setActivePlan(updatedPlan);
            setSyncing(false);
            clearInterval(pollRef.current!);
            clearTimeout(timeoutId);
          }
        }, 1500);
      });

      checkout.addEventListener("close", () => {
        setRedirectingFor(null);
      });
    } catch (err) {
      posthog.captureException(err, { event_name: "checkout_failed" });
      setRedirectingFor(null);
    }
  };

  const handlePortal = async () => {
    setRedirectingFor("portal");
    posthog.capture("billing_portal_opened", { current_plan: activePlan });
    try {
      // router.push("/api/polar/portal");
      const { data, error } = await api.billing.portal.post({});
      if (error || !data?.url) throw new Error("Portal failed");
      router.push(data.url);
    } catch (err) {
      posthog.captureException(err, { event_name: "billing_portal_failed" });
      setRedirectingFor(null);
    }
  };

  const handlePendingCheckout = ({
    tier,
    billing,
  }: {
    tier: (typeof TIERS)[number];
    billing: "once" | "monthly";
  }) => {
    // Type narrowing — Free tier has no pricing, so this should never be called for it,
    // but TypeScript doesn't know that. Guard explicitly.
    if (!("pricingMonthly" in tier) || !tier.pricingMonthly) return;

    const productId =
      billing === "once" && "pricingOnce" in tier && tier.pricingOnce
        ? tier.pricingOnce.productId
        : tier.pricingMonthly.productId;

    const allProducts =
      billing === "once" && "pricingOnce" in tier && tier.pricingOnce
        ? ALL_WITH_ONCE_PRODUCT_IDS
        : ALL_MONTHLY_PRODUCT_IDS;

    const isDowngrade =
      PLAN_ORDER.indexOf(tier.plan) < PLAN_ORDER.indexOf(activePlan);

    setPendingCheckout({
      productId,
      allProducts,
      tierName: tier.name,
      tierPlan: tier.plan,
      features: tier.features,
      billing: billing === "once" && "pricingOnce" in tier ? "once" : "monthly",
      caveats: isDowngrade
        ? (TIER_CAVEATS[tier.plan]?.downgrade ?? [])
        : billing === "once"
          ? (TIER_CAVEATS[tier.plan]?.once ?? [])
          : (TIER_CAVEATS[tier.plan]?.monthly ?? []),
      intent: isDowngrade ? "downgrade" : "upgrade",
    });
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
                <p className="font-display italic text-sm font-semibold! text-dash-text/60 mt-0.5!">
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
                <p className="font-display italic text-sm text-dash-text/60 mt-0.5!">
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
        <div className="mb-8! rounded-xl border border-[#ffffff15] bg-[#ffffff05] px-6! py-4!">
          <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-text/80">
            Payment cancelled — no charge was made
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-10! space-y-2!">
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
      {hasPolarAccount && currentPlan !== "free" && (
        <div className="mb-8!">
          <button
            onClick={handlePortal}
            disabled={redirecting}
            className="flex items-center gap-2 font-label text-sm font-bold tracking-[0.4em] uppercase px-6! py-3! rounded-full border border-dash-border-md text-dash-gold/80 transition-all hover:text-dash-gold hover:border-dash-border-hi disabled:opacity-50 cursor-pointer"
          >
            <>
              Manage Subscription <ArrowRightIcon className="size-3.5" />
            </>
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
                  <li key={f} className="flex items-center justify-start gap-2">
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
                  {"pricingMonthly" in tier &&
                    tier.pricingMonthly &&
                    (PLAN_ORDER.indexOf(tier.plan) >
                      PLAN_ORDER.indexOf(activePlan) ||
                      hasPolarAccount) && (
                      <button
                        onClick={() =>
                          handlePendingCheckout({ tier, billing: "monthly" })
                        }
                        disabled={redirecting}
                        className="flex items-center justify-center gap-1.5 w-full py-2! rounded-xl font-label text-[14px] tracking-[0.3em] uppercase transition-all border border-dash-border-hi text-dash-gold bg-dash-gold/8 hover:bg-dash-gold/[0.14] disabled:opacity-50 cursor-pointer"
                      >
                        {tier.pricingMonthly.label}
                      </button>
                    )}
                  {"pricingOnce" in tier &&
                    tier.pricingOnce &&
                    !hasEverPaid && (
                      // Only show one-time payment option for new customers — existing
                      // subscribers manage payment via the portal
                      <button
                        onClick={() =>
                          handlePendingCheckout({ tier, billing: "once" })
                        }
                        disabled={redirecting}
                        className="flex items-center justify-center gap-1.5 w-full py-2! rounded-xl font-label text-[14px] tracking-[0.3em] uppercase transition-all border border-dash-border text-dash-gold/60 hover:text-dash-gold hover:border-dash-border-md disabled:opacity-50 cursor-pointer"
                      >
                        {tier.pricingOnce.label}
                      </button>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Redirect overlay ── */}
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-dash-bg/90 backdrop-blur-sm">
          <Loader2Icon className="size-8 text-dash-gold animate-spin" />
          <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-gold">
            {redirectingFor === "portal"
              ? "Opening portal…"
              : "Opening checkout…"}
          </p>
        </div>
      )}

      {/* ── Pre-checkout feature confirmation ── */}
      {pendingCheckout && !redirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dash-bg/80 backdrop-blur-sm px-6!">
          <div className="bg-dash-surface border border-dash-border-md rounded-2xl p-8! max-w-2xl w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={clsx(
                    "font-label text-[10px] tracking-[0.5em] uppercase mb-1",
                    pendingCheckout.intent === "downgrade"
                      ? "text-[#C4A35A]/70"
                      : "text-dash-gold/70",
                  )}
                >
                  {pendingCheckout.intent === "downgrade"
                    ? "You're downgrading to"
                    : "You're upgrading to"}
                </p>
                <h2 className="font-display font-light text-[32px] text-dash-text leading-tight">
                  {pendingCheckout.tierName}
                </h2>
                <p className="font-label text-[11px] tracking-[0.3em] uppercase text-dash-gold mt-1!">
                  {pendingCheckout.billing === "once"
                    ? "$29 one-time payment"
                    : pendingCheckout.tierName === "Starter"
                      ? "$9 / month"
                      : pendingCheckout.tierName === "Pro"
                        ? "$19 / month"
                        : "$79 / month"}
                </p>
              </div>

              <button
                onClick={() => setPendingCheckout(null)}
                className="text-dash-text/30 hover:text-dash-text/60 transition-colors mt-1! shrink-0 font-label text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-2 gap-6 border-t border-dash-border pt-5!">
              {/* What's included */}
              <div>
                <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-text/70 mb-3!">
                  What's included
                </p>
                <ul className="space-y-2!">
                  {pendingCheckout.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center justify-start gap-2"
                    >
                      <StarIcon className="size-3 text-dash-gold fill-dash-gold shrink-0 mt-0.5" />
                      <span className="font-display italic text-dash-text/80 text-[16px]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — Plan details + actions */}
              <div className="flex flex-col gap-4 justify-between">
                <div>
                  {/* Plan-specific notes */}
                  {pendingCheckout.caveats.length > 0 && (
                    <>
                      <p className="font-label text-[11px] tracking-[0.4em] uppercase text-dash-text/70 mb-3!">
                        {pendingCheckout.intent === "downgrade"
                          ? "What you'll lose"
                          : pendingCheckout.billing === "once"
                            ? "Important to know"
                            : "Plan details"}
                      </p>
                      <ul className="space-y-2!">
                        {pendingCheckout.caveats.map((c) => {
                          const isWarning =
                            pendingCheckout.intent === "downgrade" ||
                            (pendingCheckout.billing === "once" &&
                              (c.includes("365") ||
                                c.includes("locked") ||
                                c.includes("No RSVP")));

                          return (
                            <li key={c} className="flex items-start gap-2">
                              <span
                                className={clsx(
                                  "text-[12px] shrink-0 mt-0.5!",
                                  isWarning
                                    ? "text-[#C4A35A]"
                                    : "text-dash-gold/80",
                                )}
                              >
                                {isWarning ? "⚠" : "✦"}
                              </span>
                              <span
                                className={clsx(
                                  "font-display italic text-[16px]",
                                  isWarning
                                    ? "text-[#C4A35A]/80"
                                    : "text-dash-text/70",
                                )}
                              >
                                {c}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Extra callout for one-time expiry */}
              {pendingCheckout.billing === "once" && (
                <div className="col-span-2 mt-2! rounded-xl border border-[#C4A35A30] bg-[#C4A35A08] px-4! py-3!">
                  <p className="font-label text-[11px] font-semibold tracking-[0.3em] uppercase text-[#C4A35A] mb-1">
                    Hosting expiry
                  </p>
                  <p className="font-display italic text-sm text-[#C4A35A]/70 leading-relaxed">
                    Your event page will be live for 365 days from today. After
                    that it will be taken offline. You can upgrade to a monthly
                    plan at any time to keep it live indefinitely.
                  </p>
                </div>
              )}

              {/* Downgrade warning callout */}
              {pendingCheckout.intent === "downgrade" && (
                <div className="col-span-2 mt-2! rounded-xl border border-[#C4A35A30] bg-[#C4A35A08] px-4! py-3!">
                  <p className="font-label text-[11px] tracking-[0.3em] uppercase text-[#C4A35A] mb-1">
                    Downgrade takes effect immediately
                  </p>
                  <p className="font-display italic text-sm text-[#C4A35A]/70 leading-relaxed">
                    Your new plan will be active as soon as the checkout
                    completes. Features from your current plan will be removed
                    immediately. This action cannot be undone — you would need
                    to upgrade again to regain access.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingCheckout(null)}
                className="w-full py-3! rounded-xl font-label text-[11px] tracking-[0.3em] uppercase text-dash-text/50 hover:text-dash-text/70 transition-colors cursor-pointer border border-dash-gold/50 hover:border-dash-gold/80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { productId, allProducts } = pendingCheckout;
                  setPendingCheckout(null);
                  handleCheckout(productId, allProducts);
                }}
                className={clsx(
                  "w-full py-3! rounded-xl font-label text-[13px] tracking-[0.3em] uppercase transition-colors cursor-pointer",
                  pendingCheckout.intent === "downgrade"
                    ? "bg-[#C4A35A] text-dash-bg hover:bg-[#C4A35A]/90"
                    : "bg-dash-gold text-dash-bg hover:bg-dash-gold/90",
                )}
              >
                {pendingCheckout.intent === "downgrade"
                  ? "Confirm downgrade"
                  : "Continue to checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
