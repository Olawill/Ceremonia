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
  envelopeEntry: boolean; // Pro+ (envelope is a premium entry style)
  roomsNavMode: boolean; // Agency only (3D rooms navigation - base 3 credits/mo included)
  registryItemLimit: number; // Infinity = unlimited
  registryScraper: boolean; // URL scraping feature
  cashGifts: boolean; // Starter+ (monetary/cash gift registry)
}

/** Monthly event creation limits (null = unlimited, 0 = none) */
export const MONTHLY_EVENTS: Record<Plan, number> = {
  free: 1,      // 1 per month, does not roll over
  starter: 1,   // 1/month for monthly subscribers
  pro: 5,       // 5/month
  agency: Infinity,
};

/** Lifetime event caps — enforced only for free/starter one-time */
export const LIFETIME_EVENTS: Record<Plan, number> = {
  free: 1,
  starter: Infinity, // monthly subscribers have no lifetime cap
  pro: Infinity,
  agency: Infinity,
};

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
    envelopeEntry: false,
    roomsNavMode: false,
    registryItemLimit: 10,
    registryScraper: false,
    cashGifts: false,
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
    envelopeEntry: false,
    roomsNavMode: false,
    registryItemLimit: 30,
    registryScraper: true,
    cashGifts: true,
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
    envelopeEntry: true,
    roomsNavMode: false,
    registryItemLimit: Infinity,
    registryScraper: true,
    cashGifts: true,
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
    envelopeEntry: true,
    roomsNavMode: true,
    registryItemLimit: Infinity,
    registryScraper: true,
    cashGifts: true,
  },
};

export const PLAN_ORDER: Plan[] = ["free", "starter", "pro", "agency"];

// Rooms Credits add-on — sold to any plan, Agency gets 3 free/mo included
export const ROOMS_CREDITS_PER_PACK = 5;
export const ROOMS_CREDITS_AGENCY_MONTHLY_FREE = 3;
export const ROOMS_CREDITS_RESET_DAYS = 30;
export const ROOMS_CREDITS_PACK_PRICE = 19; // USD per 5-credit pack

/** Returns true if userPlan meets or exceeds requiredPlan */
export function planMeetsRequirement(
  userPlan: Plan,
  requiredPlan: Plan,
): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

/** Hosting duration in days. null = no expiry (active subscription) */
export const PLAN_HOSTING_DAYS: Record<Plan, number | null> = {
  free: 365, // 12 months
  starter: null, // active subscription = no expiry
  pro: null,
  agency: null,
};

/**
 * For one-time Starter purchases specifically.
 * Subscriptions use PLAN_HOSTING_DAYS (null = no expiry).
 */
export const STARTER_ONCE_HOSTING_DAYS = 365; // 12 months

/** Returns the start of the current monthly period (UTC) */
export function getCurrentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Computes the expiry date for a newly created event.
 * Pass isOnce=true for one-time Starter purchases.
 */
export function computeEventExpiry(plan: Plan, isOnce = false): Date | null {
  if (isOnce && plan === "starter") {
    const d = new Date();
    d.setDate(d.getDate() + STARTER_ONCE_HOSTING_DAYS);
    return d;
  }
  const days = PLAN_HOSTING_DAYS[plan];
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export const PRICING = {
  starter: {
    monthly: {
      productId: env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY,
      amount: 9,
      label: "$9/mo",
    },
    once: {
      productId: env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE,
      amount: 29,
      label: "$29 once",
    },
  },
  pro: {
    monthly: {
      productId: env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY,
      amount: 19,
      label: "$19/mo",
    },
  },
  agency: {
    monthly: {
      productId: env.NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY,
      amount: 79,
      label: "$79/mo",
    },
  },
} as const;
