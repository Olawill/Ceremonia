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

const allowedOrigins = [
  env.NEXT_PUBLIC_APP_URL,
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        process.env.NGROK_URL, // e.g. https://legible-workable-lion.ngrok-free.app
      ].filter(Boolean)
    : []),
] as string[];

export const app = new Elysia({ prefix: "/api" })
  // .use(cors({ origin: env.NEXT_PUBLIC_APP_URL }))
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get("origin") ?? "";
        // Allow any ngrok tunnel in dev
        if (process.env.NODE_ENV === "development") {
          if (
            origin.endsWith(".ngrok-free.app") ||
            origin.endsWith(".ngrok.io")
          ) {
            return true;
          }
        }
        return allowedOrigins.includes(origin);
      },
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
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
