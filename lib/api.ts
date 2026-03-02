// Type-safe client using Elysia Eden Treaty
import { env } from "@/env";
import type { App } from "@/server";
import { treaty } from "@elysiajs/eden";

// In the browser, getToken() from Clerk is called before each request
// In server components, use the DB directly — this client is for client components only
export function createApiClient(getToken: () => Promise<string | null>) {
  return treaty<App>(env.NEXT_PUBLIC_APP_URL, {
    fetch: {
      credentials: "include",
    },
    headers: async () => {
      const token = await getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}
