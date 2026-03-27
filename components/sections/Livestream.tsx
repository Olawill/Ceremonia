"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLinkIcon, RadioIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  url: string;
  title?: string;
  note?: string;
  date: string; // ISO — used for the countdown
}

// ── URL normalisation ────────────────────────────────────────────────────────
export type StreamPlatform =
  | "youtube"
  | "vimeo"
  | "twitch"
  | "zoom"
  | "teams"
  | "meet"
  | "facebook"
  | "instagram"
  | "x"
  | "linkedin"
  | "crowdcast"
  | "streamyard"
  | "generic";

export interface StreamInfo {
  embedSrc: string | null; // null = cannot embed, must open externally
  platform: StreamPlatform;
  canEmbed: boolean;
  externalUrl: string; // always the original URL for the "open" button
}

export function detectStream(raw: string): StreamInfo {
  const fallback: StreamInfo = {
    embedSrc: null,
    platform: "generic",
    canEmbed: false,
    externalUrl: raw,
  };

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return fallback;
  }

  const host = u.hostname.replace(/^www\./, "");

  // ── YouTube ──────────────────────────────────────────────────────────────
  if (
    host === "youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  ) {
    const ytId =
      u.searchParams.get("v") ||
      (host === "youtu.be" ? u.pathname.slice(1) : null) ||
      (u.pathname.startsWith("/embed/")
        ? u.pathname.split("/embed/")[1]?.split("?")[0]
        : null);
    if (ytId) {
      return {
        embedSrc: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=0`,
        platform: "youtube",
        canEmbed: true,
        externalUrl: raw,
      };
    }
    // YouTube Live channel — no specific video ID yet
    return {
      embedSrc: null,
      platform: "youtube",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Vimeo ─────────────────────────────────────────────────────────────────
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) {
      return {
        embedSrc: `https://player.vimeo.com/video/${id}?dnt=1`,
        platform: "vimeo",
        canEmbed: true,
        externalUrl: raw,
      };
    }
    return {
      embedSrc: null,
      platform: "vimeo",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Twitch ────────────────────────────────────────────────────────────────
  if (host === "twitch.tv" || host === "clips.twitch.tv") {
    const parts = u.pathname.split("/").filter(Boolean);
    const channel = parts[0];
    if (channel) {
      // Twitch requires &parent= matching the host that loads the embed
      // We use a placeholder — hosts must set their actual domain in Twitch settings
      const parent =
        typeof window !== "undefined"
          ? window.location.hostname
          : "ceremonia.app";
      return {
        embedSrc: `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`,
        platform: "twitch",
        canEmbed: true,
        externalUrl: raw,
      };
    }
    return {
      embedSrc: null,
      platform: "twitch",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Facebook Live ─────────────────────────────────────────────────────────
  if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") {
    // Facebook Graph-based embed — works for public pages/posts
    const encodedUrl = encodeURIComponent(raw);
    return {
      embedSrc: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=100%`,
      platform: "facebook",
      canEmbed: true,
      externalUrl: raw,
    };
  }

  // ── Instagram Live ────────────────────────────────────────────────────────
  // Instagram does not allow embedding — always external
  if (host === "instagram.com" || host === "instagr.am") {
    return {
      embedSrc: null,
      platform: "instagram",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── X / Twitter ───────────────────────────────────────────────────────────
  // X Spaces and broadcasts can't be embedded
  if (host === "x.com" || host === "twitter.com") {
    return { embedSrc: null, platform: "x", canEmbed: false, externalUrl: raw };
  }

  // ── LinkedIn Live ─────────────────────────────────────────────────────────
  // LinkedIn does not support embedding
  if (host === "linkedin.com" || host === "lnkd.in") {
    return {
      embedSrc: null,
      platform: "linkedin",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  // Zoom meetings/webinars cannot be embedded — must open in client
  if (host.endsWith("zoom.us") || host === "zoom.com") {
    return {
      embedSrc: null,
      platform: "zoom",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Microsoft Teams ───────────────────────────────────────────────────────
  if (host === "teams.microsoft.com" || host === "teams.live.com") {
    return {
      embedSrc: null,
      platform: "teams",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Google Meet ───────────────────────────────────────────────────────────
  if (host === "meet.google.com") {
    return {
      embedSrc: null,
      platform: "meet",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Crowdcast ─────────────────────────────────────────────────────────────
  if (host === "crowdcast.io") {
    return {
      embedSrc: `${raw}?navBar=false`,
      platform: "crowdcast",
      canEmbed: true,
      externalUrl: raw,
    };
  }

  // ── StreamYard ────────────────────────────────────────────────────────────
  // StreamYard broadcasts go to YouTube/Facebook/Twitch so rarely need direct embed
  if (host === "streamyard.com") {
    return {
      embedSrc: null,
      platform: "streamyard",
      canEmbed: false,
      externalUrl: raw,
    };
  }

  // ── Anything else with /embed/ in the path — treat as already embeddable ──
  if (u.pathname.includes("/embed/") || u.searchParams.has("embed")) {
    return {
      embedSrc: raw,
      platform: "generic",
      canEmbed: true,
      externalUrl: raw,
    };
  }

  return fallback;
}
// ── Small countdown until ceremony ──────────────────────────────────────────

function StreamCountdown({
  date,
  gold,
  text,
}: {
  date: string;
  gold: string;
  text: string;
}) {
  const target = new Date(date).getTime();

  const calc = () => {
    const diff = target - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return { d, h, m };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  const units = [
    { v: time.d, l: "Days" },
    { v: time.h, l: "Hours" },
    { v: time.m, l: "Mins" },
  ];

  return (
    <div className="flex items-end gap-6">
      {units.map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center gap-1">
          <span
            className="font-display text-3xl tabular-nums"
            style={{ color: gold }}
          >
            {String(v).padStart(2, "0")}
          </span>
          <span
            className="font-label text-[9px] tracking-[0.4em] uppercase"
            style={{ color: `${text}50` }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

export const PLATFORM_META: Record<
  StreamPlatform,
  { label: string; icon: string; joinVerb: string; note: string }
> = {
  youtube: {
    label: "YouTube",
    icon: "▶",
    joinVerb: "Watch on YouTube",
    note: "Opens in YouTube",
  },
  vimeo: {
    label: "Vimeo",
    icon: "⬡",
    joinVerb: "Watch on Vimeo",
    note: "Opens in Vimeo",
  },
  twitch: {
    label: "Twitch",
    icon: "◈",
    joinVerb: "Watch on Twitch",
    note: "Opens in Twitch",
  },
  zoom: {
    label: "Zoom",
    icon: "◎",
    joinVerb: "Join Zoom Meeting",
    note: "Opens the Zoom app or browser client",
  },
  teams: {
    label: "Microsoft Teams",
    icon: "⬡",
    joinVerb: "Join on Teams",
    note: "Opens Microsoft Teams",
  },
  meet: {
    label: "Google Meet",
    icon: "◎",
    joinVerb: "Join Google Meet",
    note: "Opens in Google Meet",
  },
  facebook: {
    label: "Facebook Live",
    icon: "◈",
    joinVerb: "Watch on Facebook",
    note: "Opens Facebook",
  },
  instagram: {
    label: "Instagram Live",
    icon: "◎",
    joinVerb: "Watch on Instagram",
    note: "Opens the Instagram app",
  },
  x: {
    label: "X / Twitter",
    icon: "✕",
    joinVerb: "Watch on X",
    note: "Opens X (Twitter)",
  },
  linkedin: {
    label: "LinkedIn Live",
    icon: "◈",
    joinVerb: "Watch on LinkedIn",
    note: "Opens LinkedIn",
  },
  crowdcast: {
    label: "Crowdcast",
    icon: "◎",
    joinVerb: "Join on Crowdcast",
    note: "Opens in Crowdcast",
  },
  streamyard: {
    label: "StreamYard",
    icon: "▶",
    joinVerb: "Join Stream",
    note: "Opens the stream",
  },
  generic: {
    label: "Live Stream",
    icon: "◎",
    joinVerb: "Join Live Stream",
    note: "Opens in a new tab",
  },
};

// ── Main component ───────────────────────────────────────────────────────────

export function Livestream({ url, title, note, date }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const stream = detectStream(url);
  const meta = PLATFORM_META[stream.platform];

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      },
    );
  }, []);

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-8! py-24! gap-12"
      style={{ background: theme.bg }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl flex flex-col items-center gap-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center gap-2 px-4! py-1.5! rounded-full border"
            style={{
              borderColor: `${theme.gold}40`,
              background: `${theme.gold}08`,
            }}
          >
            <RadioIcon className="size-3" style={{ color: theme.gold }} />
            <p
              className="font-label text-[10px] tracking-[0.5em] uppercase"
              style={{ color: theme.gold }}
            >
              Live Stream
            </p>
          </div>

          <h2
            className="font-display text-[clamp(28px,5vw,48px)] tracking-[0.05em] text-center"
            style={{ color: theme.text }}
          >
            {title || "Watch Live"}
          </h2>

          <StreamCountdown date={date} gold={theme.gold} text={theme.text} />
        </div>

        {/* Platform badge */}
        <div
          className="flex items-center gap-2 px-3! py-1! rounded-full border text-[9px] font-label tracking-[0.3em] uppercase"
          style={{ borderColor: `${theme.gold}25`, color: `${theme.gold}60` }}
        >
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>

        {/* Embed or external-only CTA */}
        {stream.canEmbed && stream.embedSrc ? (
          <div
            className="w-full rounded-2xl overflow-hidden border"
            style={{
              borderColor: `${theme.gold}25`,
              aspectRatio: "16 / 9",
            }}
          >
            <iframe
              src={stream.embedSrc}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title ?? "Event Livestream"}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Cannot-embed explanation */}
            <p
              className="font-display italic text-sm text-center max-w-sm leading-relaxed"
              style={{ color: `${theme.text}50` }}
            >
              {stream.platform === "zoom" &&
                "This event uses Zoom. Click below to join — you may be prompted to open the Zoom app."}
              {stream.platform === "teams" &&
                "This event uses Microsoft Teams. Click below to join the meeting."}
              {stream.platform === "meet" &&
                "This event uses Google Meet. Click below to join."}
              {stream.platform === "instagram" &&
                "This stream is on Instagram Live. Open the app to watch."}
              {stream.platform === "linkedin" &&
                "This stream is on LinkedIn Live. Click below to watch."}
              {stream.platform === "x" &&
                "This stream is on X (Twitter). Click below to watch."}
              {(stream.platform === "generic" ||
                stream.platform === "streamyard") &&
                "Click below to join the live stream."}
            </p>

            {/* Join button */}
            <a
              href={stream.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8! py-4! rounded-2xl border font-label text-[12px] tracking-[0.4em] uppercase transition-all hover:opacity-80"
              style={{
                borderColor: `${theme.gold}50`,
                color: theme.gold,
                background: `${theme.gold}10`,
              }}
            >
              <RadioIcon className="size-4" />
              {meta.joinVerb}
              <ExternalLinkIcon className="size-3.5" />
            </a>

            {/* Sub-note */}
            <p
              className="font-label text-[9px] tracking-[0.3em] uppercase"
              style={{ color: `${theme.text}30` }}
            >
              {meta.note}
            </p>
          </div>
        )}

        {/* Note */}
        {note && (
          <p
            className="font-display italic text-sm text-center max-w-md leading-relaxed"
            style={{ color: `${theme.text}60` }}
          >
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
