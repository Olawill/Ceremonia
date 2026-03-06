import posthog from "posthog-js";

const posthogHost =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${
        window.location.hostname.includes("localhost")
          ? `localhost:${window.location.port}`
          : window.location.hostname.split(".").slice(-2).join(".")
      }/ingest`
    : "/ingest";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: posthogHost,
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
