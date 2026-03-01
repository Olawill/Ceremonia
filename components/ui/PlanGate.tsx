"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { usePlan } from "@/hooks/usePlan";

import type { Plan } from "@/lib/plans";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";

interface Props {
  requires: Plan;
  children: ReactNode;
  // Optional: custom label for what's being locked
  featureName?: string;
}

export function PlanGate({ requires, children, featureName }: Props) {
  const { can } = usePlan();

  if (can(requires)) return <>{children}</>;

  return (
    <div className="relative rounded-xl">
      {/* Blurred preview of the locked content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(4px)", opacity: 0.35 }}
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6! text-center rounded-xl"
        style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(2px)" }}
      >
        <SparklesIcon className="size-5 text-dash-gold" />
        <p
          className="font-label text-xs tracking-[0.4em] uppercase"
          style={{ color: "#D4AF37" }}
        >
          {requires.charAt(0).toUpperCase() + requires.slice(1)} Plan
        </p>
        <p
          className="font-display italic text-sm font-bold"
          style={{ color: "#F5F0E8" }}
        >
          {featureName
            ? `${featureName} requires the ${requires} plan or above.`
            : `This feature requires the ${requires} plan or above.`}
        </p>
        <Link
          href="/app/billing"
          className="font-label text-[11px] font-semibold tracking-[0.4em] uppercase px-6! py-2.5! rounded-full
                    transition-all border"
          style={{
            borderColor: "#D4AF3760",
            color: "#D4AF37",
            background: "#D4AF3715",
          }}
        >
          <span className="flex items-center gap-1">
            Upgrade <ArrowRightIcon className="size-3" />
          </span>
        </Link>
      </div>
    </div>
  );
}
