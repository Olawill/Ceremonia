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

interface RSVPProps {
  eventId?: string;
  enabled?: boolean;
  rsvpDeadline?: string;
  eventLabel?: string;
}

export function RSVP({
  eventId = "demo",
  enabled = true,
  rsvpDeadline,
  eventLabel,
}: RSVPProps) {
  const { theme } = useTheme();
  const api = useApi();
  const { handleApiError } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttendance, setSubmittedAttendance] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guests: "1" },
  });

  const deadlineLabel = rsvpDeadline
    ? `Kindly Reply By ${formattedDeadlineDate(rsvpDeadline)}`
    : "Kindly Reply At Your Earliest Convenience";

  const attendance = watch("attendance");

  const onSubmit = async (data: FormValues) => {
    if (eventId && eventId !== "demo") {
      const { data: rsvpData, error } = await api.api.rsvp.post({
        eventId,
        name: data.name,
        attendance: data.attendance,
        guests: data.guests ? Number(data.guests) : 1,
        dietary: data.dietary || undefined,
      });

      if (error) {
        handleApiError(error);

        posthog.captureException(error, {
          event_name: "rsvp_submission_failed",
        });
        console.error("RSVP failed", error);
        return;
      }
    }

    posthog.capture("rsvp_submitted", {
      event_id: eventId,
      event_type: eventLabel,
      attendance: data.attendance,
      guests:
        data.attendance === "yes" ? (data.guests ? Number(data.guests) : 1) : 0,
      has_dietary_requirements: !!data.dietary,
    });

    setSubmittedName(data.name);
    setSubmittedAttendance(data.attendance);
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
      className="min-h-screen flex flex-col items-center justify-center px-5! py-20!"
      data-testid="rsvp-section"
      style={{
        background: `radial-gradient(ellipse at 30% 70%, ${theme.curtain}18 0%, ${theme.bg} 60%)`,
        paddingInline: "4px",
      }}
    >
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="text-center mb-12! space-y-3!">
          <p
            className="font-label uppercase text-[14px] font-semibold tracking-[0.5em]"
            style={{ color: `${theme.gold}70` }}
          >
            {deadlineLabel}
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

        {!enabled ? (
          <div
            className="text-center py-16! px-10! rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}18, ${theme.bg}90)`,
              border: `1px solid ${theme.gold}40`,
            }}
          >
            <div
              className="text-4xl mb-4!"
              style={{ color: `${theme.gold}60` }}
            >
              ✦
            </div>
            <h3
              className="font-display font-light mb-2!"
              style={{ fontSize: "clamp(20px,3vw,28px)", color: theme.gold }}
            >
              RSVPs Are Closed
            </h3>
            <p
              className="font-display italic"
              style={{ color: `${theme.text}55`, fontSize: 16 }}
            >
              Thank you for your interest. We are no longer accepting responses.
            </p>
          </div>
        ) : !submitted ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="rsvp-name-input" className="sr-only">
                Your full name
              </label>
              <input
                {...register("name")}
                id="rsvp-name-input"
                placeholder="Your Full Name"
                data-testid="rsvp-name"
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                style={inputBase("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "rsvp-name-error" : undefined}
              />
              {errors.name && (
                <p
                  id="rsvp-name-error"
                  role="alert"
                  className="font-display italic text-sm mt-1!"
                  style={{ color: `${theme.gold}80` }}
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="rsvp-attendance-select" className="sr-only">
                Will you attend?
              </label>
              <select
                {...register("attendance")}
                id="rsvp-attendance-select"
                data-testid="rsvp-attendance"
                onFocus={() => setFocusedField("att")}
                onBlur={() => setFocusedField(null)}
                style={{ ...inputBase("att"), cursor: "pointer" }}
                aria-invalid={!!errors.attendance}
                aria-describedby={
                  errors.attendance ? "rsvp-attendance-error" : undefined
                }
              >
                <option value="">Will you attend?</option>
                <option value="yes" data-testid="rsvp-attending-yes">
                  Joyfully Accept
                </option>
                <option value="no">Regretfully Decline</option>
              </select>
              {errors.attendance && (
                <p
                  id="rsvp-attendance-error"
                  role="alert"
                  className="font-display italic text-sm mt-1!"
                  style={{ color: `${theme.gold}80` }}
                >
                  {errors.attendance.message}
                </p>
              )}
            </div>

            {attendance === "yes" && (
              <>
                <label htmlFor="rsvp-guests-select" className="sr-only">
                  Number of guests
                </label>
                <select
                  {...register("guests")}
                  id="rsvp-guests-select"
                  onFocus={() => setFocusedField("guests")}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputBase("guests"), cursor: "pointer" }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                </select>

                <label htmlFor="rsvp-dietary-input" className="sr-only">
                  Dietary requirements (optional)
                </label>
                <input
                  {...register("dietary")}
                  id="rsvp-dietary-input"
                  placeholder="Dietary Requirements (optional)"
                  onFocus={() => setFocusedField("diet")}
                  onBlur={() => setFocusedField(null)}
                  style={inputBase("diet")}
                />
              </>
            )}

            <button
              type="submit"
              data-testid="rsvp-submit"
              disabled={isSubmitting}
              className="mt-2! py-4! rounded-lg font-label text-[13px] tracking-[0.4em] cursor-pointer
                transition-all duration-300"
              style={{
                border: `1px solid ${theme.gold}`,
                background: `linear-gradient(135deg, ${theme.curtain}, ${theme.curtainDark})`,
                color: theme.gold,
                paddingBlock: "10px",
                opacity: isSubmitting ? 0.6 : 1,
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
              {isSubmitting ? "SENDING…" : "CONFIRM ATTENDANCE"}
            </button>
          </form>
        ) : (
          <div
            ref={modalRef}
            className="text-center py-16! px-10! rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.curtain}18, ${theme.bg}90)`,
              border: `1px solid ${theme.gold}40`,
            }}
          >
            <div className="text-5xl mb-5!" style={{ color: theme.gold }}>
              ✦
            </div>
            <h3
              className="font-display font-light mb-3!"
              style={{ fontSize: "clamp(24px,4vw,36px)", color: theme.gold }}
            >
              {submittedAttendance === "yes"
                ? "We'll See You There!"
                : "We'll Miss You"}
            </h3>
            <p
              className="font-display italic leading-relaxed"
              style={{ color: `${theme.text}75`, fontSize: 18 }}
            >
              {submittedAttendance === "yes"
                ? `Dear ${submittedName}, your presence means the world to us ♡`
                : `Dear ${submittedName}, we'll miss you at the ${eventLabel?.toLowerCase() ?? "event"}.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
