"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import {
  getVocabulary,
  type EventConfig,
  type TimelineEvent,
} from "@/types/event";

import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";
import { SectionToggle } from "./SectionToggle";

const EVENT_ICONS = [
  "✦",
  "❧",
  "♡",
  "💍",
  "💒",
  "🌹",
  "🌸",
  "🕊️",
  "✨",
  "🎶",
  "🥂",
  "💐",
  "🍾",
  "🎂",
  "💫",
  "⭐",
  "🌙",
  "☀️",
  "🕯️",
  "📜",
  "🎀",
  "🌿",
  "🍃",
  "🌾",
  "🦋",
  "👑",
  "💎",
  "🪷",
  "🫶",
  "🤍",
];

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dash-input w-full flex items-center justify-between cursor-pointer"
      >
        <span className="text-lg">{value || "✦"}</span>
        <span
          className="font-label text-[9px] tracking-widest uppercase"
          style={{ color: "#D4AF3760" }}
        >
          Pick
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-50 rounded-xl border border-[#D4AF3720] bg-[#0F0A0A] shadow-2xl p-2"
          style={{ minWidth: "200px" }}
        >
          <div className="grid grid-cols-6 gap-1">
            {EVENT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  onChange(icon);
                  setOpen(false);
                }}
                className="flex items-center justify-center rounded-lg p-2 text-lg transition-all hover:bg-[#D4AF3715] cursor-pointer"
                style={{
                  background: value === icon ? "#D4AF3720" : "transparent",
                  outline: value === icon ? "1px solid #D4AF3740" : "none",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
}

export function TimelineEditor({ config, onChange }: Props) {
  const vocab = getVocabulary(config.eventType);

  const {
    register,
    control,
    watch,
    setValue,
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
    let mounted = false;
    const { unsubscribe } = watch((values) => {
      if (!mounted) {
        mounted = true;
        return;
      }
      if (values.timeline) {
        onChange({ timeline: values.timeline as TimelineEvent[] });
      }
    });
    return unsubscribe;
  }, [watch, onChange]);

  return (
    <div className="space-y-5!">
      <SectionToggle
        label="Our Story"
        enabled={config.timelineEnabled ?? false}
        onToggle={() => onChange({ timelineEnabled: !config.timelineEnabled })}
        disabledMessage={`Enable to showcase the story for your ${vocab.eventLabel.toLowerCase()} invitation.`}
      />

      {config.timelineEnabled && (
        <>
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
                  <IconPicker
                    value={watch(`timeline.${i}.icon`)}
                    onChange={(v) =>
                      setValue(`timeline.${i}.icon`, v, {
                        shouldValidate: true,
                      })
                    }
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
            disabled={fields.length >= 8}
            className="w-full py-3! rounded-xl font-label text-[12px] forn-semibold tracking-[0.4em] uppercase transition-all border"
            style={{
              borderColor: "#D4AF3760",
              color: "#D4AF37",
              borderStyle: "dashed",
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              {fields.length >= 8 ? (
                "Maximum of 8 timeline events reached"
              ) : (
                <>
                  <PlusIcon className="size-3" />
                  Add Milestone
                </>
              )}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
