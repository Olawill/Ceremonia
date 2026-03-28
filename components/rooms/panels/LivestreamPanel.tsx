"use client";
import { detectStream, PLATFORM_META } from "@/components/sections/Livestream";
import { useTheme } from "@/lib/ThemeContext";
import { ExternalLinkIcon, RadioIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  url: string;
  title?: string;
  note?: string;
  date: string;
  sectionLabel?: string; // vocab.eventLabel
}

function MiniCountdown({ date, gold }: { date: string; gold: string }) {
  const calc = () => {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!t)
    return (
      <p
        className="font-label text-[8px] tracking-[0.4em] uppercase"
        style={{ color: `${gold}60` }}
      >
        Live now
      </p>
    );
  return (
    <div className="flex gap-3">
      {[
        { v: t.d, l: "D" },
        { v: t.h, l: "H" },
        { v: t.m, l: "M" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center gap-0.5">
          <span
            className="font-label font-semibold text-base tabular-nums"
            style={{ color: gold }}
          >
            {String(v).padStart(2, "0")}
          </span>
          <span
            className="font-label font-semibold text-[7px] tracking-widest uppercase"
            style={{ color: `${gold}90` }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LivestreamPanel({ url, title, note, date, sectionLabel }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);
  const stream = detectStream(url);
  const meta = PLATFORM_META[stream.platform];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-5">
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div className="relative flex items-center justify-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border transition-opacity duration-700"
              style={{
                width: 20 + i * 20,
                height: 20 + i * 20,
                borderColor: `${theme.gold}${pulse ? 50 - i * 10 : 30 - i * 5}`,
                opacity: pulse ? 1 : 0.4,
                transitionDelay: `${i * 0.12}s`,
              }}
            />
          ))}
          <div
            className="relative z-10 rounded-full flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              background: `radial-gradient(circle, ${theme.gold}30, ${theme.curtain}60)`,
              border: `1px solid ${theme.gold}50`,
              boxShadow: `0 0 20px ${theme.gold}30`,
            }}
          >
            <RadioIcon className="size-5" style={{ color: theme.gold }} />
          </div>
        </div>
      </div>

      <div
        className="text-center flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease 0.2s",
        }}
      >
        <div
          className="flex items-center gap-2 px-3! py-1! rounded-full"
          style={{
            border: `1px solid ${theme.gold}40`,
            background: `${theme.gold}10`,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#ff4444",
              boxShadow: "0 0 6px #ff444480",
              animation: "blink 1s ease infinite",
            }}
          />
          <p
            className="font-label text-[8px] tracking-[0.4em] uppercase"
            style={{ color: theme.gold }}
          >
            Live Stream
          </p>
        </div>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(18px,3.5vw,28px)",
            color: theme.text,
            letterSpacing: "0.06em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {title ?? (sectionLabel ?? "Watch Live")}
        </h2>
        <MiniCountdown date={date} gold={theme.gold} />
      </div>

      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${theme.gold}30`,
          background: `linear-gradient(135deg, ${theme.curtain}40, rgba(0,0,0,0.7))`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${theme.gold}20`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease 0.4s",
        }}
      >
        {stream.canEmbed && stream.embedSrc ? (
          <div style={{ aspectRatio: "16/9" }}>
            <iframe
              src={stream.embedSrc}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={title ?? "Stream"}
            />
          </div>
        ) : (
          <div className="px-5! py-5! flex flex-col items-center gap-4">
            <span style={{ fontSize: 28 }}>{meta.icon}</span>
            <div className="text-center">
              <p
                className="font-label text-[8px] tracking-[0.4em] uppercase"
                style={{ color: `${theme.gold}80` }}
              >
                {meta.label}
              </p>
              <p
                className="font-display italic text-xs mt-1!"
                style={{ color: `${theme.text}85` }}
              >
                {meta.note}
              </p>
            </div>
            <a
              href={stream.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5! py-2.5! rounded-xl font-label text-[9px] tracking-[0.35em] uppercase transition-opacity hover:opacity-80"
              style={{
                border: `1px solid ${theme.gold}50`,
                color: theme.gold,
                background: `${theme.gold}15`,
              }}
            >
              <RadioIcon className="size-3.5" />
              {meta.joinVerb}
              <ExternalLinkIcon className="size-2.5" />
            </a>
          </div>
        )}
      </div>

      {note && (
        <p
          className="font-display italic text-xs text-center max-w-xs leading-relaxed"
          style={{
            color: `${theme.text}90`,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s ease 0.5s",
          }}
        >
          {note}
        </p>
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
