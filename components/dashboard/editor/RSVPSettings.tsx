"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import type { WeddingConfig } from "@/types/wedding";

import { Field, Input } from "@/components/ui/FormPrimitives";
import { PlanGate } from "@/components/ui/PlanGate";

const schema = z
  .object({
    rsvpEnabled: z.boolean(),
    rsvpDeadline: z.string().optional(),
    passwordProtected: z.boolean(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.passwordProtected &&
      (!data.password || data.password.trim().length < 4)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 4 characters",
        path: ["password"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function RSVPSettings({ config, onChange }: Props) {
  const {
    register,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rsvpEnabled: config.rsvpEnabled,
      rsvpDeadline: config.rsvpDeadline ?? "",
      passwordProtected: config.passwordProtected,
      password: (config as any).password ?? "",
    },
    mode: "onChange",
  });

  const passwordProtected = useWatch({ control, name: "passwordProtected" });
  const rsvpEnabled = useWatch({ control, name: "rsvpEnabled" });

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      onChange(values as Partial<WeddingConfig>);
    });
    return unsubscribe;
  }, [watch, onChange]);

  return (
    <div className="space-y-5">
      <p
        className="font-label text-[10px] tracking-[0.5em] uppercase"
        style={{ color: "#D4AF3770" }}
      >
        RSVP Settings
      </p>

      <Field label="Accept RSVPs">
        <Toggle
          value={rsvpEnabled}
          onChange={(v) => {
            setValue("rsvpEnabled", v);
            onChange({ rsvpEnabled: v });
          }}
          label={rsvpEnabled ? "Open — guests can RSVP" : "Closed"}
        />
      </Field>

      <Field label="RSVP Deadline">
        <Input type="date" {...register("rsvpDeadline")} />
      </Field>

      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #D4AF3720, transparent)",
        }}
      />

      <p
        className="font-label text-[10px] tracking-[0.5em] uppercase"
        style={{ color: "#D4AF3770" }}
      >
        Access
      </p>

      <PlanGate requires="pro" featureName="Password protection">
        <Field label="Password Protection">
          <Toggle
            value={passwordProtected}
            onChange={(v) => {
              setValue("passwordProtected", v);
              onChange({ passwordProtected: v });
            }}
            label={
              passwordProtected
                ? "Password required to view"
                : "Public — anyone with the link can view"
            }
          />
        </Field>

        {passwordProtected && (
          <Field label="Password" error={errors.password?.message}>
            <Input
              type="text"
              {...register("password")}
              placeholder="Enter a password (min 4 chars)"
              hasError={!!errors.password}
            />
          </Field>
        )}
      </PlanGate>
    </div>
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
