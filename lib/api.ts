// Type-safe client using Elysia Eden Treaty
import type { App } from "@/server";
import { treaty } from "@elysiajs/eden";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin; // browser: use current host
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL; // SSR
  return "http://localhost:3000"; // fallback
};

// In the browser, getToken() from Clerk is called before each request
// In server components, use the DB directly — this client is for client components only
export function createApiClient(getToken: () => Promise<string | null>) {
  // return treaty<App>(env.NEXT_PUBLIC_APP_URL, {
  return treaty<App>(getBaseUrl(), {
    fetch: {
      credentials: "include",
    },
    headers: async () => {
      const token = await getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}
