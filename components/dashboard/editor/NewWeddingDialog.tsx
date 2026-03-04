"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/ui/DatePicker";
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
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2! bg-dash-bg/95 backdrop-blur-md">
      <div className="w-full max-w-lg mx-auto rounded-2xl p-4! space-y-8! bg-dash-surface border border-dash-border">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="font-label text-xs font-bold tracking-[0.5em] uppercase text-dash-gold/70">
            <span className="flex items-center justify-center gap-2">
              <SparklesIcon className="size-3.5" /> New Wedding
            </span>
          </p>
          <h2 className="font-display font-light text-3xl text-dash-text tracking-wide">
            Let's get started
          </h2>
          <p className="font-display italic font-bold text-sm text-dash-text/65">
            You can customise everything in the editor — this is just the
            essentials.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-dash-border" />

        {/* Form */}
        <form
          onSubmit={handleSubmit(onConfirm)}
          className="space-y-5! font-semibold"
        >
          <div className="grid grid-cols-2 gap-4 font-semibold">
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
            <DatePicker
              value={watch("date") ?? ""}
              onChange={(val) =>
                setValue("date", val, { shouldValidate: true })
              }
              hasError={!!errors.date}
              placeholder="Pick the big day"
            />
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
            className={clsx(
              "w-full py-4! rounded-xl font-label text-xs tracking-[0.4em] uppercase transition-all duration-300 mt-2",
              isValid
                ? "dash-btn-primary"
                : "bg-white/5 border border-dash-border text-dash-gold/80! disabled:text-dash-gold/25! cursor-not-allowed",
            )}
          >
            <span className="flex items-center justify-center gap-2">
              Open Editor <ArrowRightIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
