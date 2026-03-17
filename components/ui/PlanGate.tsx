"use client";

import { useState, type ReactNode } from "react";

import { usePlan } from "@/hooks/usePlan";

import type { Plan } from "@/lib/plans";
import { ArrowRightIcon, LockIcon, SparklesIcon, XIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  requires: Plan;
  children: ReactNode;
  // Optional: custom label for what's being locked
  featureName?: string;
}

export function PlanGate({ requires, children, featureName }: Props) {
  const { can } = usePlan();
  const [open, setOpen] = useState(false);

  if (can(requires)) return <>{children}</>;

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

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-999 flex items-center justify-center p-6!"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
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
              <Link
                href="/app/billing"
                className="flex-1 py-2.5! rounded-full font-label text-[11px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ background: "#D4AF37", color: "#080808" }}
              >
                Upgrade <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
