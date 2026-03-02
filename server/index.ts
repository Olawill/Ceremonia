import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { env } from "@/env";

import { billingRouter } from "@/server/routers/billing";
import { customThemesRouter } from "@/server/routers/customThemes";
import { rsvpRouter } from "@/server/routers/rsvp";
import { weddingsRouter } from "@/server/routers/weddings";

export const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: env.NEXT_PUBLIC_APP_URL }))
  .use(bearer())
  .use(weddingsRouter)
  .use(rsvpRouter)
  .use(billingRouter)
  .use(customThemesRouter);

export type App = typeof app;
