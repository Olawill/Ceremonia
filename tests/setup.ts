vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_ROOT_DOMAIN: "ceremonia.app",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
    POLAR_ACCESS_TOKEN: "polar_test_token",
    POLAR_WEBHOOK_SECRET: "polar_webhook_secret_test",
    POLAR_SERVER: "sandbox",
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY: "prod_starter_monthly",
    NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE: "prod_starter_once",
    NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY: "prod_pro_monthly",
    NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY: "prod_agency_monthly",
    NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://app.posthog.com",
    NEXT_PUBLIC_EVENT_THEME: "royal",
    CLERK_SECRET_KEY: "sk_test_123",
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
