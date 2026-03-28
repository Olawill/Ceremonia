"use client";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/lib/ThemeContext";
import { useState } from "react";

interface Message {
  name: string;
  message: string;
  createdAt: string;
}

export function GuestBookPanel({
  eventId,
  enabled,
  existingMessages = [],
  sectionLabel,
}: {
  eventId: string;
  enabled: boolean;
  existingMessages?: Message[];
  sectionLabel?: string; // vocab.guestBookLabel
}) {
  const { theme } = useTheme();
  const { api } = useApi();
  const { toast, handleApiError } = useToast();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [view, setView] = useState<"write" | "read">("write");

  if (!enabled) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    border: `1px solid ${theme.gold}25`,
    color: theme.text,
    fontSize: 13,
    outline: "none",
    fontFamily: '"Cormorant Garamond", serif',
  };

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    const { error } = await api
      .guestbook({ eventSlug: eventId })
      .post({ name: name.trim(), message: message.trim() });
    if (error) {
      handleApiError(error, "Failed to send");
    } else {
      setMessages((prev) => [
        { name, message, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setDone(true);
      toast.success("Message added ✦");
    }
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-4">
      <svg viewBox="0 0 80 50" fill="none" className="w-14 opacity-70">
        <path
          d="M40,8 Q30,6 10,10 L10,44 Q30,40 40,42 Q50,40 70,44 L70,10 Q50,6 40,8 Z"
          stroke={`${theme.gold}90`}
          strokeWidth="1"
          fill={`${theme.curtain}70`}
        />
        <line
          x1="40"
          y1="8"
          x2="40"
          y2="42"
          stroke={`${theme.gold}80`}
          strokeWidth="0.8"
        />
        {[16, 22, 28, 34].map((y) => (
          <line
            key={y}
            x1="14"
            y1={y}
            x2="36"
            y2={y}
            stroke={`${theme.gold}65`}
            strokeWidth="0.5"
          />
        ))}
        {[16, 22, 28, 34].map((y) => (
          <line
            key={`r${y}`}
            x1="44"
            y1={y}
            x2="66"
            y2={y}
            stroke={`${theme.gold}65`}
            strokeWidth="0.5"
          />
        ))}
      </svg>

      <div className="text-center">
        <p
          className="font-label font-semibold text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}95`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          Leave a Note
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(24px,5vw,40px)",
            color: theme.text,
            letterSpacing: "0.06em",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {sectionLabel ?? "Guest Book"}
        </h2>
      </div>

      {messages.length > 0 && (
        <div
          className="flex gap-1 p-0.5 rounded-full"
          style={{
            border: `1px solid ${theme.gold}20`,
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {(["write", "read"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="font-label text-[7px] tracking-[0.3em] uppercase px-3! py-1! rounded-full cursor-pointer transition-all"
              style={{
                background: view === v ? `${theme.gold}20` : "transparent",
                color: view === v ? theme.gold : `${theme.gold}45`,
                border:
                  view === v
                    ? `1px solid ${theme.gold}35`
                    : "1px solid transparent",
              }}
            >
              {v === "write" ? "Write" : `Read (${messages.length})`}
            </button>
          ))}
        </div>
      )}

      {view === "write" ? (
        !done ? (
          <div className="w-full max-w-xs flex flex-col gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message…"
              rows={3}
              className="resize-none"
              style={inputStyle}
            />
            <button
              onClick={submit}
              disabled={submitting}
              className="py-2.5! rounded-xl font-label text-[9px] tracking-[0.4em] uppercase cursor-pointer hover:opacity-80 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${theme.curtain}, ${theme.curtainDark})`,
                border: `1px solid ${theme.gold}50`,
                color: theme.gold,
              }}
            >
              {submitting ? "Signing…" : "Sign the Book ✦"}
            </button>
          </div>
        ) : (
          <div
            className="text-center px-4! py-3! rounded-xl"
            style={{
              border: `1px solid ${theme.gold}25`,
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <p
              className="font-display italic text-sm"
              style={{ color: `${theme.gold}80` }}
            >
              Thank you for your kind words ✦
            </p>
          </div>
        )
      ) : (
        <div
          className="w-full max-w-xs flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: 200 }}
        >
          {messages.slice(0, 6).map((m, i) => (
            <div
              key={i}
              className="px-3! py-2.5! rounded-xl"
              style={{
                border: `1px solid ${theme.gold}15`,
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
              }}
            >
              <p
                className="font-label text-[8px] tracking-widest mb-1!"
                style={{ color: theme.gold }}
              >
                {m.name}
              </p>
              <p
                className="font-display italic text-xs leading-snug"
                style={{ color: `${theme.text}80` }}
              >
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
