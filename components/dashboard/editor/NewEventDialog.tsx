"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field, Input } from "@/components/ui/FormPrimitives";

import {
  EVENT_TYPES,
  EVENT_VOCABULARY,
  EventType,
  getVocabulary,
} from "@/types/event";

const schema = z.object({
  eventType: z.enum(EVENT_TYPES), // import EVENT_TYPES from "@/types/event"
  host1Name: z.string().min(1, "Required"),
  host2Name: z.string().optional(),
  date: z.string().min(1, "Required"),
  notificationEmail: z
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onConfirm: (values: FormValues) => void;
}

export function NewEventDialog({ onConfirm }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventType: "wedding",
    },
    mode: "onChange",
  });

  const selectedType = watch("eventType") ?? "wedding";
  const vocab = getVocabulary(selectedType);

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2! bg-dash-bg/95 backdrop-blur-md">
      <div className="w-full max-w-lg mx-auto rounded-2xl p-4! space-y-8! bg-dash-surface border border-dash-border">
        {/* Back to dashboard */}
        <button
          type="button"
          onClick={() => router.push("/app/dashboard")}
          className="flex items-center gap-1.5 font-label text-[10px] tracking-widest uppercase text-dash-gold/50 hover:text-dash-gold transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-3" />
          Dashboard
        </button>
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="font-label text-xs font-bold tracking-[0.5em] uppercase text-dash-gold/70">
            <span className="flex items-center justify-center gap-2">
              <SparklesIcon className="size-3.5" /> {vocab.newEventCta}
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
          {/* Event type picker */}
          <div className="space-y-2!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                Object.entries(EVENT_VOCABULARY) as [
                  EventType,
                  (typeof EVENT_VOCABULARY)[EventType],
                ][]
              ).map(([type, v]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setValue("eventType", type, { shouldValidate: true })
                  }
                  className="px-2! py-2! rounded-lg border font-label text-[10px] tracking-widest uppercase text-left transition-all duration-150 flex items-center gap-1.5 truncate"
                  style={{
                    borderColor:
                      selectedType === type ? "#D4AF3790" : "#D4AF3720",
                    background:
                      selectedType === type ? "#D4AF3712" : "transparent",
                    color: selectedType === type ? "#D4AF37" : "#F5F0E870",
                  }}
                >
                  <span>{v.emoji}</span>
                  <span className="truncate">{v.eventLabel}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 font-semibold">
            <Field
              label={vocab.host1Label + "'s Name"}
              error={errors.host1Name?.message}
              className={clsx(!vocab.dualHost && "col-span-2")}
            >
              <Input
                {...register("host1Name")}
                placeholder="Isabella"
                hasError={!!errors.host1Name}
                autoFocus
              />
            </Field>
            {vocab.dualHost && (
              <Field
                label={vocab.host2Label + "'s Name"}
                error={errors.host2Name?.message}
              >
                <Input
                  {...register("host2Name")}
                  placeholder="Alexander"
                  hasError={!!errors.host2Name}
                />
              </Field>
            )}
          </div>

          <Field
            label={`${vocab.eventLabel} Date`}
            error={errors.date?.message}
          >
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
