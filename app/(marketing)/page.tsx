import { auth } from "@clerk/nextjs/server";
import clsx from "clsx";
import { eq } from "drizzle-orm";
import { StarIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { db } from "@/db";
import { users } from "@/db/schema";

import { Plan } from "@/lib/plans";
import { HeroHeadline } from "./HeroHeadline";

export const metadata: Metadata = {
  title: "Ceremonia — Beautiful Event Invitations",
  description:
    "Create cinematic, personalised event invitations your guests will never forget. RSVP management, custom themes, and your own subdomain.",
  openGraph: {
    title: "Ceremonia — Beautiful Event Invitations",
    description:
      "Create cinematic, personalised event invitations your guests will never forget.",
    url: "https://ceremonia.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ceremonia — Beautiful Event Invitations",
    description:
      "Create cinematic, personalised event invitations your guests will never forget.",
  },
};

const FEATURES = [
  "Cinematic curtain reveal",
  "Scratch-to-reveal date",
  "Custom themes & colours",
  "RSVP management",
  "Password protection",
  "Live preview editor",
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    description: "Try it out",
    features: ["1 event", "3 themes", "20 RSVPs", "Ceremonia watermark"],
    cta: "Start free",
    href: "/sign-up",
  },
  {
    name: "Starter",
    price: "$9/mo",
    description: "For couples (or $29 one-time)",
    features: [
      "All themes",
      "Both curtain styles",
      "Custom audio",
      "Unlimited RSVPs",
      "No watermark",
    ],
    cta: "Get Starter",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$19/mo",
    description: "For power users",
    features: [
      "5 events",
      "Custom theme builder",
      "Analytics",
      "CSV export",
      "Password protection",
    ],
    cta: "Get Pro",
  },
  {
    name: "Agency",
    price: "$79/mo",
    description: "For planners",
    features: [
      "Unlimited events",
      "White-label",
      "Client management",
      "API access",
    ],
    cta: "Get Agency",
  },
];

const PLAN_TO_PRODUCT: Record<string, string> = {
  starter: "starter_monthly", // readable key — resolved in BillingClient
  pro: "pro_monthly",
  agency: "agency_monthly",
};

export default async function MarketingPage() {
  const { userId } = await auth();

  let userPlan: Plan | null = null;
  if (userId) {
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userPlan = (user?.plan as Plan) ?? "free";
  }

  return (
    <div className="size-full text-[#F5F0E8] flex flex-col gap-2">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6! pt-20 font-semibold">
        <HeroHeadline />
        <p className="font-display italic text-xl text-[#F5F0E8] mb-12! max-w-xl">
          Create a cinematic invitation your guests will never forget —
          weddings, birthdays, baby showers and more. Live editor, custom
          themes, RSVP management — all in one place.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/sign-up"
            className="font-label text-[12px] tracking-[0.4em] uppercase px-8! py-4! rounded-full bg-[#D4AF37] text-dash-bg hover:bg-[#D4AF37]/90 transition-colors"
          >
            Create your invitation
          </Link>
          <Link
            href="/event/demo"
            className="font-label text-[12px] tracking-[0.4em] uppercase px-8! py-4! rounded-full border border-[#D4AF3790] text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
          >
            See the demo
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-16!">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 font-label text-[10px] tracking-[0.3em] uppercase px-4! py-2! rounded-full border border-[#D4AF3770] text-[#D4AF37]"
            >
              <StarIcon className="size-2.5 fill-[#D4AF3760] text-[#D4AF37]" />
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6! py-2 w-full mx-auto">
        <div className="text-center mb-8">
          <p className="font-label text-[14px] font-semibold tracking-[0.5em] uppercase text-[#D4AF37] mb-4">
            Pricing
          </p>
          <h2 className="font-display font-light text-[clamp(32px,5vw,56px)] tracking-[0.02em]">
            Simple, transparent pricing
          </h2>
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={clsx(
                "rounded-2xl p-7! flex flex-col gap-5 border hover:border-[#D4AF3780] hover:shadow-md",
                tier.highlighted
                  ? "border-[#D4AF3780] bg-[#D4AF3708]"
                  : "border-[#D4AF3720] bg-[#D4AF3703]",
              )}
            >
              <div>
                <p className="font-label text-sm font-semibold tracking-widest uppercase text-[#D4AF37] mb-1">
                  {tier.name}
                </p>
                <p className="font-display font-light text-[32px] text-[#F5F0E8]">
                  {tier.price}
                </p>
                <p className="font-display font-semibold italic text-[#F5F0E8]">
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-2! flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <StarIcon className="size-3 text-[#D4AF37] fill-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="font-display italic text-[#F5F0E8] text-base">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {(() => {
                const tierPlan = tier.name.toLowerCase() as Plan;
                const isCurrent = userPlan === tierPlan;

                // Current plan badge
                if (isCurrent && userPlan !== "free") {
                  return (
                    <Link
                      href="/app/billing"
                      className="text-center font-label font-semibold text-[12px] tracking-[0.4em] uppercase py-3! rounded-xl border border-[#D4AF3780] text-[#D4AF37] hover:bg-[#D4AF3710] transition-colors"
                    >
                      Manage Subscription
                    </Link>
                  );
                }

                // Free tier
                if (tier.name === "Free") {
                  return (
                    <Link
                      href={
                        userId
                          ? userPlan === "free"
                            ? "/app/billing"
                            : "/app/dashboard"
                          : "/sign-up"
                      }
                      className="text-center font-label font-semibold text-[12px] tracking-[0.4em] uppercase py-3! rounded-xl border border-[#D4AF3730] text-[#D4AF3780] hover:text-[#D4AF37] hover:border-[#D4AF3750] transition-colors"
                    >
                      {userId
                        ? userPlan === "free"
                          ? "Current plan"
                          : "Dashboard"
                        : "Start free"}
                    </Link>
                  );
                }

                return (
                  <Link
                    href={
                      userId
                        ? `/app/billing?autoOpen=${PLAN_TO_PRODUCT[tier.name.toLowerCase()]}`
                        : `/sign-up?redirect_url=${encodeURIComponent(`/app/billing?autoOpen=${PLAN_TO_PRODUCT[tier.name.toLowerCase()]}`)}`
                    }
                    className={clsx(
                      "text-center font-label font-semibold text-[12px] tracking-[0.4em] uppercase py-3! rounded-xl border transition-colors",
                      tier.highlighted
                        ? "border-[#D4AF3780] text-[#D4AF37] hover:bg-[#D4AF3710]"
                        : "border-[#D4AF3730] text-[#D4AF3780] hover:text-[#D4AF37] hover:border-[#D4AF3750]",
                    )}
                  >
                    {isCurrent ? "Current plan" : tier.cta}
                  </Link>
                );
              })()}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
