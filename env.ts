import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    UNSPLASH_ACCESS_KEY: z.string().min(1),
    PIXABAY_API_KEY: z.string().min(1),

    // Polar
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),

    // Set in Vercel project settings — Vercel Cron automatically sends this
    // as a Bearer token on scheduled invocations, so cron routes can verify
    // the request actually came from Vercel Cron and not a random caller.
    CRON_SECRET: z.string().min(1).optional(),
  },
  client: {
    // Polar
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY: z.string().min(1),
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE: z.string().min(1),
    NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY: z.string().min(1),
    NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY: z.string().min(1),
    NEXT_PUBLIC_POLAR_PRODUCT_ROOMS_CREDITS: z.string().min(1),

    NEXT_PUBLIC_EVENT_THEME: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
    // Polar
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_SERVER: process.env.POLAR_SERVER,
    CRON_SECRET: process.env.CRON_SECRET,

    NEXT_PUBLIC_EVENT_THEME: process.env.NEXT_PUBLIC_EVENT_THEME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Polar
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY:
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY,
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE:
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE,
    NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY:
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY,
    NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY:
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY,
    NEXT_PUBLIC_POLAR_PRODUCT_ROOMS_CREDITS:
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_ROOMS_CREDITS,
  },
});
