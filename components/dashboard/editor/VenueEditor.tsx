"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import type { VenueEvent, WeddingConfig } from "@/types/wedding";

import { Field, Input } from "@/components/ui/FormPrimitives";

const schema = z.object({
  venueDetails: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required"),
        value: z.string().min(1, "Value is required"),
        sub: z.string().min(1, "Sub-label is required"),
      }),
    )
    .min(1, "Add at least one venue row"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function VenueEditor({ config, onChange }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { venueDetails: config.venueDetails ?? [] },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "venueDetails",
  });

  // Sync up to parent on every change
  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values.venueDetails) {
        onChange({ venueDetails: values.venueDetails as VenueEvent[] });
      }
    });
    return unsubscribe;
  }, [watch, onChange]);

  const rootError =
    errors.venueDetails?.root?.message ?? (errors.venueDetails as any)?.message;

  return (
    <div className="space-y-5">
      <p
        className="font-label text-[10px] tracking-[0.5em] uppercase"
        style={{ color: "#D4AF3770" }}
      >
        Venue &amp; Schedule
      </p>

      {rootError && (
        <p className="font-display italic text-xs" style={{ color: "#ff6b6b" }}>
          {rootError}
        </p>
      )}

      {fields.map((field, i) => (
        <div
          key={field.id}
          className="p-4 rounded-xl space-y-3 relative"
          style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
        >
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 font-label text-[10px] tracking-widest"
            style={{ color: "#D4AF3750" }}
          >
            ✕
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Label"
              error={errors.venueDetails?.[i]?.label?.message}
            >
              <Input
                {...register(`venueDetails.${i}.label`)}
                placeholder="Ceremony"
                hasError={!!errors.venueDetails?.[i]?.label}
              />
            </Field>
            <Field
              label="Value"
              error={errors.venueDetails?.[i]?.value?.message}
            >
              <Input
                {...register(`venueDetails.${i}.value`)}
                placeholder="4:00 PM"
                hasError={!!errors.venueDetails?.[i]?.value}
              />
            </Field>
          </div>

          <Field
            label="Sub-label"
            error={errors.venueDetails?.[i]?.sub?.message}
          >
            <Input
              {...register(`venueDetails.${i}.sub`)}
              placeholder="Grand Ballroom"
              hasError={!!errors.venueDetails?.[i]?.sub}
            />
          </Field>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ label: "", value: "", sub: "" })}
        className="w-full py-3 rounded-xl font-label text-[10px] tracking-[0.4em]
                   uppercase transition-all border"
        style={{
          borderColor: "#D4AF3730",
          color: "#D4AF3770",
          borderStyle: "dashed",
        }}
      >
        + Add Row
      </button>
    </div>
  );
}
