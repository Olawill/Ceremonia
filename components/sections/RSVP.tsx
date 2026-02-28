"use client";

import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";
import gsap from "gsap";
import { useRef, useState } from "react";

type Attendance = "yes" | "no" | "";

interface FormState {
  name: string;
  attendance: Attendance;
  guests: string;
  dietary: string;
}

interface RSVPProps {
  weddingId?: string;
  enabled?: boolean;
}

export function RSVP({ weddingId = "demo", enabled = true }: RSVPProps) {
  const { theme } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    attendance: "",
    guests: "1",
    dietary: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Button is enabled only when name is filled AND attendance is chosen
  const canSubmit = form.name.trim().length > 0 && form.attendance !== "";

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    fireConfetti({
      count: 150,
      fixed: true,
      colors: [
        theme.gold,
        theme.goldLight,
        "#ffffff",
        theme.curtain,
        theme.curtainSheen,
      ],
      origin: { x: "50%", y: "40%" },
    });

    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.4)" },
      );
    }
  };

  const inputBase = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: 8,
    background: `${theme.bg}CC`,
    border: `1px solid ${focusedField === field ? theme.gold : `${theme.gold}30`}`,
    color: theme.text,
    fontSize: 18,
    outline: "none",
    fontFamily: '"Cormorant Garamond", serif',
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxShadow: focusedField === field ? `0 0 20px ${theme.gold}28` : "none",
    appearance: "none" as const,
  });

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-5 py-20"
      style={{
        background: `radial-gradient(ellipse at 30% 70%, ${theme.curtain}18 0%, ${theme.bg} 60%)`,
        paddingInline: "4px",
      }}
    >
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="text-center mb-12 space-y-3">
          <p
            className="font-label uppercase text-[14px] font-semibold tracking-[0.5em]"
            style={{ color: `${theme.gold}70` }}
          >
            Kindly Reply By June 1st, 2026
          </p>
          <h2
            className="font-display font-light"
            style={{
              fontSize: "clamp(40px,7vw,72px)",
              color: theme.text,
              letterSpacing: "0.08em",
            }}
          >
            RSVP
          </h2>
          <div
            className="w-16 h-px mx-auto"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
            }}
          />
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              required
              placeholder="Your Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              style={inputBase("name")}
            />

            <select
              required
              value={form.attendance}
              onChange={(e) =>
                setForm({ ...form, attendance: e.target.value as Attendance })
              }
              onFocus={() => setFocusedField("att")}
              onBlur={() => setFocusedField(null)}
              style={{ ...inputBase("att"), cursor: "pointer" }}
            >
              <option value="">Will you attend?</option>
              <option value="yes">Joyfully Accept</option>
              <option value="no">Regretfully Decline</option>
            </select>

            {form.attendance === "yes" && (
              <>
                <select
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  onFocus={() => setFocusedField("guests")}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputBase("guests"), cursor: "pointer" }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                </select>

                <input
                  placeholder="Dietary Requirements (optional)"
                  value={form.dietary}
                  onChange={(e) =>
                    setForm({ ...form, dietary: e.target.value })
                  }
                  onFocus={() => setFocusedField("diet")}
                  onBlur={() => setFocusedField(null)}
                  style={inputBase("diet")}
                />
              </>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 py-4 rounded-lg font-label text-[13px] tracking-[0.4em] cursor-pointer
                        transition-all duration-300"
              style={{
                border: `1px solid ${theme.gold}`,
                background: `linear-gradient(135deg, ${theme.curtain}, ${theme.curtainDark})`,
                color: theme.gold,
                paddingBlock: "10px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  `linear-gradient(135deg, ${theme.curtainSheen}, ${theme.curtain})`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 0 30px ${theme.gold}45`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  `linear-gradient(135deg, ${theme.curtain}, ${theme.curtainDark})`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              CONFIRM ATTENDANCE
            </button>

            {!canSubmit && (
              <p
                className="font-label text-[12px] font-semibold tracking-[0.3em] text-center"
                style={{ color: `${theme.gold}45` }}
              >
                PLEASE FILL IN YOUR NAME AND ATTENDANCE
              </p>
            )}
          </form>
        ) : (
          <div
            ref={modalRef}
            className="text-center py-16 px-10 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}18, ${theme.bg}90)`,
              border: `1px solid ${theme.gold}40`,
            }}
          >
            <div className="text-5xl mb-5" style={{ color: theme.gold }}>
              ✦
            </div>
            <h3
              className="font-display font-light mb-3"
              style={{ fontSize: "clamp(24px,4vw,36px)", color: theme.gold }}
            >
              {form.attendance === "yes"
                ? "We'll See You There!"
                : "We'll Miss You"}
            </h3>
            <p
              className="font-display italic leading-relaxed"
              style={{ color: `${theme.text}75`, fontSize: 18 }}
            >
              {form.attendance === "yes"
                ? `Dear ${form.name}, your presence means the world to us ♡`
                : `Dear ${form.name}, you'll be in our hearts on the day.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
