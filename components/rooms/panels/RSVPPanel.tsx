"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import gsap from "gsap";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/lib/ThemeContext";
import { fireConfetti } from "@/lib/confetti";
import { formattedDeadlineDate } from "@/lib/helper";

const schema = z.object({
  name: z.string().min(1, "Your name is required"),
  attendance: z.enum(["yes", "no"], {
    message: "Please select your attendance",
  }),
  guests: z.string().optional(),
  dietary: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  eventId?: string;
  enabled?: boolean;
  rsvpDeadline?: string;
  eventLabel?: string;
}

export function RSVPPanel({
  eventId = "demo",
  enabled = true,
  rsvpDeadline,
  eventLabel,
}: Props) {
  const { theme } = useTheme();
  const api = useApi();
  const { handleApiError } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttendance, setSubmittedAttendance] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guests: "1" },
  });

  const attendance = watch("attendance");
  const deadlineLabel = rsvpDeadline
    ? `Kindly reply by ${formattedDeadlineDate(rsvpDeadline)}`
    : "Kindly reply at your earliest convenience";

  const onSubmit = async (data: FormValues) => {
    if (eventId && eventId !== "demo") {
      const { error } = await api.api.rsvp.post({
        eventId,
        name: data.name,
        attendance: data.attendance,
        guests: data.guests ? Number(data.guests) : 1,
        dietary: data.dietary || undefined,
      });
      if (error) {
        handleApiError(error);
        return;
      }
    }
    posthog.capture("rsvp_submitted", {
      event_id: eventId,
      attendance: data.attendance,
    });
    setSubmittedName(data.name);
    setSubmittedAttendance(data.attendance);
    setSubmitted(true);
    fireConfetti({
      count: 100,
      fixed: true,
      colors: [theme.gold, theme.goldLight, "#ffffff", theme.curtain],
      origin: { x: "50%", y: "40%" },
    });
    if (cardRef.current)
      gsap.fromTo(
        cardRef.current,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.4)" },
      );
  };

  const fieldStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    border: `1px solid ${focusedField === field ? theme.gold + "70" : theme.gold + "20"}`,
    color: theme.text,
    fontSize: 13,
    outline: "none",
    fontFamily: '"Cormorant Garamond", serif',
    boxShadow: focusedField === field ? `0 0 12px ${theme.gold}20` : "none",
    transition: "border-color 0.3s, box-shadow 0.3s",
    appearance: "none" as const,
  });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5! gap-4 overflow-y-auto py-8!">
      {/* Wax seal + heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Envelope flap SVG */}
        <svg viewBox="0 0 60 40" fill="none" className="w-10 opacity-80">
          <path
            d="M2,2 L30,24 L58,2 Z"
            fill={`${theme.curtain}90`}
            stroke={`${theme.gold}70`}
            strokeWidth="0.8"
          />
          <rect
            x="2"
            y="2"
            width="56"
            height="36"
            rx="2"
            fill="none"
            stroke={`${theme.gold}60`}
            strokeWidth="0.8"
          />
          <circle
            cx="30"
            cy="22"
            r="6"
            fill={`${theme.curtain}90`}
            stroke={`${theme.gold}80`}
            strokeWidth="0.8"
          />
          <text
            x="30"
            y="26"
            fill={`${theme.gold}`}
            fontSize="7"
            textAnchor="middle"
            fontFamily="serif"
          >
            ✦
          </text>
        </svg>

        <p
          className="font-label font-semibold text-[8px] tracking-[0.6em] uppercase"
          style={{
            color: `${theme.gold}`,
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}
        >
          {deadlineLabel}
        </p>
        <h2
          className="font-display font-light"
          style={{
            fontSize: "clamp(24px,5vw,40px)",
            color: theme.text,
            letterSpacing: "0.1em",
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
          }}
        >
          RSVP
        </h2>
        <div
          className="h-px w-16"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.gold}60, transparent)`,
          }}
        />
      </div>

      {/* Response card */}
      {!enabled ? (
        <div
          className="w-full max-w-xs text-center py-6! px-4! rounded-2xl"
          style={{
            border: `1px solid ${theme.gold}30`,
            background: `linear-gradient(135deg, ${theme.curtain}30, rgba(0,0,0,0.6))`,
            backdropFilter: "blur(12px)",
          }}
        >
          <p
            className="font-display font-light text-lg"
            style={{ color: theme.gold }}
          >
            RSVPs Are Closed
          </p>
          <p
            className="font-display italic text-xs mt-2!"
            style={{ color: `${theme.text}50` }}
          >
            Thank you — we are no longer accepting responses.
          </p>
        </div>
      ) : !submitted ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-xs flex flex-col gap-2"
        >
          <div>
            <input
              {...register("name")}
              placeholder="Your Full Name"
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle("name")}
            />
            {errors.name && (
              <p
                className="font-display italic text-xs mt-0.5!"
                style={{ color: `${theme.gold}70` }}
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <select
              {...register("attendance")}
              onFocus={() => setFocusedField("att")}
              onBlur={() => setFocusedField(null)}
              style={{ ...fieldStyle("att"), cursor: "pointer" }}
            >
              <option value="">Will you attend?</option>
              <option value="yes">Joyfully Accept</option>
              <option value="no">Regretfully Decline</option>
            </select>
            {errors.attendance && (
              <p
                className="font-display italic text-xs mt-0.5!"
                style={{ color: `${theme.gold}70` }}
              >
                {errors.attendance.message}
              </p>
            )}
          </div>

          {attendance === "yes" && (
            <>
              <select
                {...register("guests")}
                onFocus={() => setFocusedField("guests")}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle("guests"), cursor: "pointer" }}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
              </select>
              <input
                {...register("dietary")}
                placeholder="Dietary requirements (optional)"
                onFocus={() => setFocusedField("diet")}
                onBlur={() => setFocusedField(null)}
                style={fieldStyle("diet")}
              />
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1! py-2.5! rounded-xl font-label text-[9px] tracking-[0.45em] uppercase cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              border: `1px solid ${theme.gold}60`,
              background: `linear-gradient(135deg, ${theme.curtain}80, ${theme.curtainDark})`,
              color: theme.gold,
              boxShadow: `0 0 20px ${theme.gold}15`,
            }}
          >
            {isSubmitting ? "SENDING…" : "CONFIRM ATTENDANCE"}
          </button>
        </form>
      ) : (
        <div
          ref={cardRef}
          className="w-full max-w-xs text-center py-5! px-5! rounded-2xl flex flex-col items-center gap-2"
          style={{
            border: `1px solid ${theme.gold}35`,
            background: `linear-gradient(135deg, ${theme.curtain}30, rgba(0,0,0,0.65))`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 30px ${theme.gold}15`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: theme.gold,
              filter: `drop-shadow(0 0 12px ${theme.gold}60)`,
            }}
          >
            ✦
          </div>
          <h3
            className="font-display font-light"
            style={{ fontSize: "clamp(16px,3vw,22px)", color: theme.gold }}
          >
            {submittedAttendance === "yes"
              ? "We'll See You There!"
              : "We'll Miss You"}
          </h3>
          <p
            className="font-display italic text-xs leading-relaxed"
            style={{ color: `${theme.text}70` }}
          >
            {submittedAttendance === "yes"
              ? `Dear ${submittedName}, your presence means the world to us ♡`
              : `Dear ${submittedName}, we'll miss you at the ${eventLabel?.toLowerCase() ?? "event"}.`}
          </p>
        </div>
      )}
    </div>
  );
}
