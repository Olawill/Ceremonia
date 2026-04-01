"use client";

import {
  BedDoubleIcon,
  type LucideIcon,
  MapPinIcon,
  PlaneIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";

import type { EventConfig, TravelItem } from "@/types/event";
import { getVocabulary } from "@/types/event";

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
}

const TYPE_OPTIONS: {
  value: TravelItem["type"];
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "hotel", label: "Hotel", icon: BedDoubleIcon },
  { value: "airport", label: "Airport", icon: PlaneIcon },
  { value: "tip", label: "Local Tip", icon: MapPinIcon },
];

const DEFAULT_ITEM = (): TravelItem => ({
  type: "tip",
  name: "",
  description: "",
  link: "",
});

export function TravelGuideEditor({ config, onChange }: Props) {
  const items = config.travelItems ?? [];
  const vocab = getVocabulary(config.eventType);

  const update = (index: number, patch: Partial<TravelItem>) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange({ travelItems: next });
  };

  const remove = (index: number) =>
    onChange({ travelItems: items.filter((_, i) => i !== index) });

  const add = () => onChange({ travelItems: [...items, DEFAULT_ITEM()] });

  return (
    <div className="space-y-6!">
      <SectionToggle
        label="Travel Guide"
        enabled={config.travelGuideEnabled ?? false}
        onToggle={() =>
          onChange({ travelGuideEnabled: !config.travelGuideEnabled })
        }
        disabledMessage={`Enable to provide travel tips and directions for guests coming to your ${vocab.eventLabel.toLowerCase()}.`}
      />

      {config.travelGuideEnabled && (
        <>
          <div className="space-y-4!">
            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border p-3! space-y-3!"
                style={{ borderColor: "#D4AF3720", background: "#D4AF3706" }}
              >
                {/* Type selector */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {TYPE_OPTIONS.map(({ value, label, icon }) => {
                      const Icon = icon;
                      return (
                        <button
                          key={value}
                          onClick={() => update(i, { type: value })}
                          className="flex items-center gap-1.5 px-2.5! py-1.5! rounded-lg border font-label text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                          style={{
                            borderColor:
                              item.type === value ? "#D4AF3790" : "#D4AF3730",
                            background:
                              item.type === value ? "#D4AF3715" : "transparent",
                            color:
                              item.type === value ? "#D4AF37" : "#F5F0E870",
                          }}
                        >
                          <Icon className="size-3" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => remove(i)}
                    className="p-1! rounded-lg cursor-pointer"
                    style={{ color: "#D4AF3760" }}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>

                <Field label="Name">
                  <Input
                    value={item.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder={
                      item.type === "hotel"
                        ? "The Grand Palazzo"
                        : item.type === "airport"
                          ? "Florence Airport (FLR)"
                          : "Best local restaurant"
                    }
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={item.description}
                    onChange={(e) => update(i, { description: e.target.value })}
                    placeholder="A short note for guests…"
                    rows={2}
                  />
                </Field>

                <Field label="Link (optional)">
                  <Input
                    value={item.link ?? ""}
                    onChange={(e) => update(i, { link: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            ))}
          </div>

          <button
            onClick={add}
            className="flex items-center gap-2 w-full py-2.5! px-3! rounded-xl border border-dashed font-label text-[11px] tracking-widest uppercase transition-all cursor-pointer"
            style={{ borderColor: "#D4AF3730", color: "#D4AF3770" }}
          >
            <PlusIcon className="size-3.5" />
            Add Travel Item
          </button>
        </>
      )}
    </div>
  );
}
