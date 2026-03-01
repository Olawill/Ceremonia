"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import type { TimelineEvent, WeddingConfig } from "@/types/wedding";

import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";
import { PlusIcon, XIcon } from "lucide-react";

const schema = z.object({
  timeline: z.array(
    z.object({
      year: z.string().min(1, "Year is required"),
      icon: z.string().min(1, "Icon is required"),
      title: z.string().min(1, "Title is required"),
      desc: z.string().min(1, "Description is required"),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function TimelineEditor({ config, onChange }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timeline: config.timeline ?? [] },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeline",
  });

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      if (values.timeline) {
        onChange({ timeline: values.timeline as TimelineEvent[] });
      }
    });
    return unsubscribe;
  }, [watch, onChange]);

  return (
    <div className="space-y-5!">
      <p
        className="font-label text-[12px] font-semibold tracking-[0.5em] uppercase"
        style={{ color: "#D4AF37" }}
      >
        Our Story
      </p>

      {fields.map((field, i) => (
        <div
          key={field.id}
          className="p-4! rounded-xl space-y-3! relative font-semibold"
          style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
        >
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 font-label text-[10px] tracking-widest hover:cursor-pointer hover:font-bold! hover:scale-1.15!"
            style={{ color: "#D4AF3750" }}
          >
            <XIcon className="size-3" />
          </button>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Year" error={errors.timeline?.[i]?.year?.message}>
              <Input
                {...register(`timeline.${i}.year`)}
                placeholder="2024"
                hasError={!!errors.timeline?.[i]?.year}
              />
            </Field>
            <Field label="Icon" error={errors.timeline?.[i]?.icon?.message}>
              <Input
                {...register(`timeline.${i}.icon`)}
                placeholder="✦"
                hasError={!!errors.timeline?.[i]?.icon}
              />
            </Field>
            <div /> {/* spacer */}
          </div>

          <Field label="Title" error={errors.timeline?.[i]?.title?.message}>
            <Input
              {...register(`timeline.${i}.title`)}
              placeholder="First Meeting"
              hasError={!!errors.timeline?.[i]?.title}
            />
          </Field>

          <Field label="Story" error={errors.timeline?.[i]?.desc?.message}>
            <Textarea
              {...register(`timeline.${i}.desc`)}
              placeholder="Two souls crossed paths…"
              rows={2}
              hasError={!!errors.timeline?.[i]?.desc}
            />
          </Field>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            year: new Date().getFullYear().toString(),
            icon: "✦",
            title: "",
            desc: "",
          })
        }
        className="w-full py-3! rounded-xl font-label text-[12px] forn-semibold tracking-[0.4em] uppercase transition-all border"
        style={{
          borderColor: "#D4AF3760",
          color: "#D4AF37",
          borderStyle: "dashed",
        }}
      >
        <span className="flex items-center justify-center gap-1.5">
          <PlusIcon className="size-3" />
          Add Milestone
        </span>
      </button>
    </div>
  );
}
