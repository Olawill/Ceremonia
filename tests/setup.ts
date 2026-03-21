vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_ROOT_DOMAIN: "ceremonia.app",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_stripe",
    NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
    NEXT_PUBLIC_STRIPE_PRICE_STARTER_ONCE: "price_starter_once",
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
    NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY: "price_agency_monthly",
    NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
    NEXT_PUBLIC_EVENT_THEME: "royal",
    CLERK_SECRET_KEY: "sk_test_123",
    STRIPE_SECRET_KEY: "sk_test_stripe",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    RESEND_API_KEY: "re_test_123",
  },
}));

import "@testing-library/jest-dom";
import { afterAll, beforeAll, vi } from "vitest";

// Mock Clerk globally - tests shouldn't need real auth
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { id: "test-user-id", publicMetadata: { plan: "pro" } },
    isLoaded: true,
  }),
  useAuth: () => ({ userId: "test-user-id", isSignedIn: true }),
  auth: async () => ({ userId: "test-user-id" }),
  currentUser: async () => ({
    id: "test-user-id",
    emailAddresses: [{ emailAddress: "test@test.com" }],
  }),
  UserButton: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "test-user-id" }),
  clerkMiddleware: (fn: Function) => fn,
  createRouteMatcher: () => () => false,
  currentUser: async () => ({ id: "test-user-id" }),
}));

// Silence console.error in tests unless explicitly needed
const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning:")) return;
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
