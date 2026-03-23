import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { env } from "@/env";

import { billingRouter } from "@/server/routers/billing";
import { customThemesRouter } from "@/server/routers/customThemes";
import { eventsRouter } from "@/server/routers/events";
import { guestbookRouter } from "@/server/routers/guestbook";
import { registryRouter } from "@/server/routers/registry";
import { roomsRouter } from "@/server/routers/rooms";
import { rsvpRouter } from "@/server/routers/rsvp";
import { settingsRouter } from "@/server/routers/settings";
import { stockRouter } from "@/server/routers/stock";
import { uploadRouter } from "@/server/routers/upload";

export const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: env.NEXT_PUBLIC_APP_URL }))
  .use(bearer())
  .use(eventsRouter)
  .use(rsvpRouter)
  .use(billingRouter)
  .use(customThemesRouter)
  .use(uploadRouter)
  .use(stockRouter)
  .use(settingsRouter)
  .use(registryRouter)
  .use(guestbookRouter)
  .use(roomsRouter);

export type App = typeof app;
