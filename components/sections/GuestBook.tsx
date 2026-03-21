"use client";

import { useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

interface Message {
  name: string;
  message: string;
  createdAt: string;
}

interface Props {
  eventId: string;
  enabled: boolean;
  existingMessages?: Message[];
}

export function GuestBook({ eventId, enabled, existingMessages = [] }: Props) {
  const { theme } = useTheme();
  const { api } = useApi();
  const { toast, handleApiError } = useToast();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!enabled) return null;

  const submit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);

    const { data, error } = await api.guestbook({ eventSlug: eventId }).post({
      name: name.trim(),
      message: message.trim(),
    });

    if (error) {
      handleApiError(error, "Failed to send your message");
    } else {
      setMessages((prev) => [
        { name, message, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setDone(true);
      toast.success("Message added to the guest book ✦");
    }

    setSubmitting(false);
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-8! py-20! gap-10">
      <p
        className="font-label text-[14px] font-semibold tracking-[0.5em] uppercase"
        style={{ color: theme.gold }}
      >
        Leave a Note
      </p>
      <h2 className="font-display text-3xl" style={{ color: theme.text }}>
        Guest Book
      </h2>

      {!done ? (
        <div className="w-full max-w-md flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="px-4! py-3! rounded-xl border bg-transparent font-display"
            style={{ borderColor: `${theme.gold}30`, color: theme.text }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message for the couple..."
            rows={4}
            className="px-4! py-3! rounded-xl border bg-transparent font-display resize-none"
            style={{ borderColor: `${theme.gold}30`, color: theme.text }}
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="py-3! rounded-xl font-label text-[12px] tracking-[0.4em] uppercase"
            style={{ background: theme.gold, color: theme.bg }}
          >
            {submitting ? "Sending…" : "Sign the Book"}
          </button>
        </div>
      ) : (
        <p
          className="font-display text-lg"
          style={{ color: `${theme.text}80` }}
        >
          Thank you for your kind words ✦
        </p>
      )}

      {messages.length > 0 && (
        <div className="w-full max-w-md flex flex-col gap-3 mt-4!">
          {messages.slice(0, 8).map((m, i) => (
            <div
              key={i}
              className="p-4! rounded-xl border"
              style={{
                borderColor: `${theme.gold}15`,
                background: `${theme.gold}05`,
              }}
            >
              <p
                className="font-label text-[10px] tracking-widest mb-1!"
                style={{ color: theme.gold }}
              >
                {m.name}
              </p>
              <p
                className="font-display text-sm"
                style={{ color: `${theme.text}90` }}
              >
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
