"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { WeddingConfig } from "@/types/wedding";

import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";

const schema = z.object({
  bride: z.string().min(1, "Bride's name is required"),
  groom: z.string().min(1, "Groom's name is required"),
  date: z.string().min(1, "Date is required"),
  tagLine: z.string().optional(),
  finaleTagLine: z.string().optional(),
  notificationEmail: z
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function ContentEditor({ config, onChange }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bride: config.bride,
      groom: config.groom,
      date: config.date,
      tagLine: config.tagLine ?? "",
      finaleTagLine: config.finaleTagLine ?? "",
      notificationEmail: (config as any).notificationEmail ?? "",
      published: config.published,
    },
    mode: "onChange",
  });

  // Sync every field change up to parent EditorShell
  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      onChange(values as Partial<WeddingConfig>);
    });
    return unsubscribe;
  }, [watch, onChange]);

  return (
    <div className="space-y-5! font-semibold">
      <SectionHeading>The Couple</SectionHeading>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bride's Name" error={errors.bride?.message}>
          <Input
            {...register("bride")}
            placeholder="Isabella"
            hasError={!!errors.bride}
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
        label="Invitation Tagline"
        hint="Shown in the invitation body (e.g. 'Together with our families…')"
      >
        <Textarea
          {...register("tagLine")}
          placeholder="Together with our families, we joyfully invite you…"
          rows={3}
        />
      </Field>

      <Field
        label="Closing Line"
        hint="Shown at the very end of the invitation (e.g. 'See You at The Altar')"
      >
        <Input
          {...register("finaleTagLine")}
          placeholder="See You at The Altar"
        />
      </Field>

      <SectionHeading>Settings</SectionHeading>

      <Field label="Published">
        <Toggle
          value={watch("published")}
          onChange={(v) => {
            setValue("published", v);
            onChange({ published: v });
          }}
          label={
            watch("published")
              ? "Live — guests can view"
              : "Draft — hidden from guests"
          }
        />
      </Field>

      <Field
        label="Notification Email"
        hint="Get emailed when someone RSVPs"
        error={errors.notificationEmail?.message}
      >
        <Input
          type="email"
          {...register("notificationEmail")}
          placeholder="you@example.com"
          hasError={!!errors.notificationEmail}
        />
      </Field>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-label text-[12px] font-semibold tracking-[0.5em] uppercase pt-2"
      style={{ color: "#D4AF37" }}
    >
      {children}
    </p>
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 w-full text-left"
    >
      <div
        className="w-10 h-6 rounded-full transition-colors relative shrink-0"
        style={{ background: value ? "#D4AF3740" : "#ffffff10" }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full transition-transform"
          style={{
            background: value ? "#D4AF37" : "#ffffff40",
            transform: value ? "translateX(20px)" : "translateX(4px)",
          }}
        />
      </div>
      <span
        className="font-display italic text-sm"
        style={{ color: "#F5F0E870" }}
      >
        {label}
      </span>
    </button>
  );
}
