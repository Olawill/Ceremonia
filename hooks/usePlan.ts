"use client";

import { useUser } from "@clerk/nextjs";

import type { Plan } from "@/lib/plans";
import { PLAN_FEATURES, planMeetsRequirement } from "@/lib/plans";

export function usePlan() {
  const { user } = useUser();
  // Plan is stored in Clerk's publicMetadata, synced by the webhook
  const plan = (user?.publicMetadata?.plan as Plan | undefined) ?? "free";
  const features = PLAN_FEATURES[plan];

  return {
    plan,
    features,
    can: (requiredPlan: Plan) => planMeetsRequirement(plan, requiredPlan),
  };
}
