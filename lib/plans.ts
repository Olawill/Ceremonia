import { env } from "@/env";

export type Plan = "free" | "starter" | "pro" | "agency";

export interface PlanFeatures {
  maxEvents: number; // Infinity = unlimited
  customThemes: boolean; // Pro+
  customAudio: boolean; // Starter+
  allBuiltInThemes: boolean; // Starter+
  bothCurtainStyles: boolean; // Starter+
  proCurtainStyles: boolean; // Pro+ (sheer, cascade)
  watermark: boolean; // free only
  unlimitedRsvps: boolean; // Starter+
  rsvpEmails: boolean; // Starter+
  passwordProtection: boolean; // Pro+
  analytics: boolean; // Pro+
  csvExport: boolean; // Pro+
  customDomain: boolean; // Pro+
  whitLabel: boolean; // Agency
  apiAccess: boolean; // Agency
  registryItemLimit: number; // Infinity = unlimited
  registryScraper: boolean; // URL scraping feature
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    maxEvents: 1,
    customThemes: false,
    customAudio: false,
    allBuiltInThemes: false,
    bothCurtainStyles: false,
    proCurtainStyles: false,
    watermark: true,
    unlimitedRsvps: false,
    rsvpEmails: false,
    passwordProtection: false,
    analytics: false,
    csvExport: false,
    customDomain: false,
    whitLabel: false,
    apiAccess: false,
    registryItemLimit: 10,
    registryScraper: false,
  },
  starter: {
    maxEvents: 1,
    customThemes: false,
    customAudio: true,
    allBuiltInThemes: true,
    bothCurtainStyles: true,
    proCurtainStyles: false,
    watermark: false,
    unlimitedRsvps: true,
    rsvpEmails: true,
    passwordProtection: false,
    analytics: false,
    csvExport: false,
    customDomain: false,
    whitLabel: false,
    apiAccess: false,
    registryItemLimit: 30,
    registryScraper: true,
  },
  pro: {
    maxEvents: 5,
    customThemes: true,
    customAudio: true,
    allBuiltInThemes: true,
    bothCurtainStyles: true,
    proCurtainStyles: true,
    watermark: false,
    unlimitedRsvps: true,
    rsvpEmails: true,
    passwordProtection: true,
    analytics: true,
    csvExport: true,
    customDomain: true,
    whitLabel: false,
    apiAccess: false,
    registryItemLimit: Infinity,
    registryScraper: true,
  },
  agency: {
    maxEvents: Infinity,
    customThemes: true,
    customAudio: true,
    allBuiltInThemes: true,
    bothCurtainStyles: true,
    proCurtainStyles: true,
    watermark: false,
    unlimitedRsvps: true,
    rsvpEmails: true,
    passwordProtection: true,
    analytics: true,
    csvExport: true,
    customDomain: true,
    whitLabel: true,
    apiAccess: true,
    registryItemLimit: Infinity,
    registryScraper: true,
  },
};

export const PLAN_ORDER: Plan[] = ["free", "starter", "pro", "agency"];

/** Returns true if userPlan meets or exceeds requiredPlan */
export function planMeetsRequirement(
  userPlan: Plan,
  requiredPlan: Plan,
): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

export const PRICING = {
  starter: {
    monthly: {
      priceId: env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY!,
      amount: 9,
      label: "$9/mo",
    },
    once: {
      priceId: env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ONCE!,
      amount: 29,
      label: "$29 once",
    },
  },
  pro: {
    monthly: {
      priceId: env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
      amount: 19,
      label: "$19/mo",
    },
  },
  agency: {
    monthly: {
      priceId: env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY!,
      amount: 79,
      label: "$79/mo",
    },
  },
} as const;
