"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { usePlan } from "@/hooks/usePlan";

import type { Plan } from "@/lib/plans";

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
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred preview of the locked content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(4px)", opacity: 0.35 }}
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center rounded-xl"
        style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(2px)" }}
      >
        <div style={{ color: "#D4AF37", fontSize: 24 }}>✦</div>
        <p
          className="font-label text-xs tracking-[0.4em] uppercase"
          style={{ color: "#D4AF37" }}
        >
          {requires.charAt(0).toUpperCase() + requires.slice(1)} Plan
        </p>
        <p
          className="font-display italic text-sm"
          style={{ color: "#F5F0E870" }}
        >
          {featureName
            ? `${featureName} requires the ${requires} plan or above.`
            : `This feature requires the ${requires} plan or above.`}
        </p>
        <Link
          href="/app/billing"
          className="font-label text-[11px] tracking-[0.4em] uppercase px-6 py-3 rounded-full
                    transition-all border"
          style={{
            borderColor: "#D4AF3760",
            color: "#D4AF37",
            background: "#D4AF3715",
          }}
        >
          Upgrade →
        </Link>
      </div>
    </div>
  );
}
