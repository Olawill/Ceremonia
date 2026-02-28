"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import gsap from "gsap";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  weddingId?: string;
  enabled?: boolean;
  rsvpDeadline?: string;
}

export function RSVP({
  weddingId = "demo",
  enabled = true,
  rsvpDeadline,
}: RSVPProps) {
  const { theme } = useTheme();
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
    // Wire to API in Week 6 — for now just show success
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

        {!submitted ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <input
                {...register("name")}
                placeholder="Your Full Name"
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                style={inputBase("name")}
              />
              {errors.name && (
                <p
                  className="font-display italic text-sm mt-1"
                  style={{ color: `${theme.gold}80` }}
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
                style={{ ...inputBase("att"), cursor: "pointer" }}
              >
                <option value="">Will you attend?</option>
                <option value="yes">Joyfully Accept</option>
                <option value="no">Regretfully Decline</option>
              </select>
              {errors.attendance && (
                <p
                  className="font-display italic text-sm mt-1"
                  style={{ color: `${theme.gold}80` }}
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
                  style={{ ...inputBase("guests"), cursor: "pointer" }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                </select>

                <input
                  {...register("dietary")}
                  placeholder="Dietary Requirements (optional)"
                  onFocus={() => setFocusedField("diet")}
                  onBlur={() => setFocusedField(null)}
                  style={inputBase("diet")}
                />
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 py-4 rounded-lg font-label text-[13px] tracking-[0.4em] cursor-pointer
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
                : `Dear ${submittedName}, you'll be in our hearts on the day.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
