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
// Converts a share URL into a nocookie embed src

function toEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);

    // YouTube — watch?v= or youtu.be/
    const ytId =
      u.searchParams.get("v") ||
      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
    if (ytId) {
      return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
    }

    // Vimeo — vimeo.com/123456789
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}?dnt=1`;
    }

    // Already an embed src — return as-is
    if (u.pathname.includes("/embed/") || u.pathname.includes("/video/")) {
      return raw;
    }

    return null;
  } catch {
    return null;
  }
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

// ── Main component ───────────────────────────────────────────────────────────

export function Livestream({ url, title, note, date }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const embedSrc = toEmbedUrl(url);

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
      className="min-h-screen flex flex-col items-center justify-center px-8 py-24 gap-12"
      style={{ background: theme.bg }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl flex flex-col items-center gap-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
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

        {/* Embed or fallback link */}
        {embedSrc ? (
          <div
            className="w-full rounded-2xl overflow-hidden border"
            style={{
              borderColor: `${theme.gold}25`,
              aspectRatio: "16 / 9",
            }}
          >
            <iframe
              src={embedSrc}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title ?? "Event Livestream"}
            />
          </div>
        ) : (
          /* URL provided but couldn't be embedded — show a styled link button */
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl border font-label text-[12px] tracking-[0.4em] uppercase transition-all hover:opacity-80"
            style={{
              borderColor: `${theme.gold}50`,
              color: theme.gold,
              background: `${theme.gold}10`,
            }}
          >
            <RadioIcon className="size-4" />
            Watch the Ceremony Live
            <ExternalLinkIcon className="size-3.5" />
          </a>
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
