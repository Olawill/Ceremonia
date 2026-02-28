"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field, Input } from "@/components/ui/FormPrimitives";

const schema = z.object({
  bride: z.string().min(1, "Required"),
  groom: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  notificationEmail: z
    .string()
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onConfirm: (values: FormValues) => void;
}

export function NewWeddingDialog({ onConfirm }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  return (
    // Full-screen overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(5,5,5,0.92)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-10 space-y-8"
        style={{ background: "#0E0E0E", border: "1px solid #D4AF3730" }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <p
            className="font-label text-xs tracking-[0.5em] uppercase"
            style={{ color: "#D4AF3770" }}
          >
            ✦ New Wedding
          </p>
          <h2
            className="font-display font-light"
            style={{
              fontSize: "clamp(24px,4vw,36px)",
              color: "#F5F0E8",
              letterSpacing: "0.05em",
            }}
          >
            Let's get started
          </h2>
          <p
            className="font-display italic text-sm"
            style={{ color: "#F5F0E840" }}
          >
            You can customise everything in the editor — this is just the
            essentials.
          </p>
        </div>

        {/* Divider */}
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D4AF3730, transparent)",
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bride's Name" error={errors.bride?.message}>
              <Input
                {...register("bride")}
                placeholder="Isabella"
                hasError={!!errors.bride}
                autoFocus
              />
            </Field>
            <Field label="Groom's Name" error={errors.groom?.message}>
              <Input
                {...register("groom")}
                placeholder="Alexander"
                hasError={!!errors.groom}
              />
            </Field>
          </div>

          <Field label="Wedding Date" error={errors.date?.message}>
            <Input type="date" {...register("date")} hasError={!!errors.date} />
          </Field>

          <Field
            label="Your Email"
            hint="For RSVP notifications — you can change this later"
            error={errors.notificationEmail?.message}
          >
            <Input
              type="email"
              {...register("notificationEmail")}
              placeholder="you@example.com"
              hasError={!!errors.notificationEmail}
            />
          </Field>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-4 rounded-xl font-label text-xs tracking-[0.4em]
                      uppercase transition-all duration-300 mt-2"
            style={{
              background: isValid
                ? "linear-gradient(135deg, #6A0D17, #3D0610)"
                : "#ffffff08",
              border: `1px solid ${isValid ? "#D4AF3760" : "#D4AF3720"}`,
              color: isValid ? "#D4AF37" : "#D4AF3740",
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            Open Editor →
          </button>
        </form>
      </div>
    </div>
  );
}
