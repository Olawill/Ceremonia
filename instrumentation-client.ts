import posthog from "posthog-js";

const posthogHost =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${
        window.location.hostname.includes("localhost")
          ? `localhost:${window.location.port}`
          : window.location.hostname.split(".").slice(-2).join(".")
      }/ingest`
    : "/ingest";

const getApiHost = () => {
  if (typeof window === "undefined") return "/ingest";

  const { protocol, hostname, port } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // For localhost, include port; for any other host (ngrok, prod), use full hostname
  const base = isLocalhost
    ? `${protocol}//${hostname}:${port}`
    : `${protocol}//${hostname}`;

  return `${base}/ingest`;
};

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  // api_host: posthogHost,
  api_host: getApiHost(),
  // api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  // Disable PostHog session recording (rrweb) on the dashboard/editor —
  // rrweb's DOM mutation observer conflicts with React concurrent mode
  // when the iframe is unmounted during navigation, causing
  // "childNodes is null" crashes in rrweb-record.js.
  disable_session_recording: true,
});
