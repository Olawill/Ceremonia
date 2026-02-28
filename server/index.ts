import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { rsvpRouter } from "@/server/routers/rsvp";
import { weddingsRouter } from "@/server/routers/weddings";

export const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL }))
  .use(bearer())
  .use(weddingsRouter)
  .use(rsvpRouter);

export type App = typeof app;
