"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";

import { DatePicker } from "@/components/ui/DatePicker";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import type {
  AccommodationConfig,
  AccommodationOption,
  WeddingConfig,
} from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

const DEFAULT_OPTION = (): AccommodationOption => ({
  id: nanoid(8),
  name: "",
  description: "",
  address: "",
  distanceFromVenue: "",
  pricePerNight: "",
  bookingDeadline: "",
  bookingUrl: "",
  phone: "",
  stars: undefined,
  blockCode: "",
  imageUrl: "",
});

const DEFAULT_CONFIG: AccommodationConfig = {
  intro: "",
  options: [],
};

function OptionEditor({
  option,
  onUpdate,
  onDelete,
}: {
  option: AccommodationOption;
  onUpdate: (patch: Partial<AccommodationOption>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(!option.name);

  return (
    <div className="rounded-xl border border-[#D4AF3720] overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4! py-3! cursor-pointer"
        style={{ background: "#D4AF3708" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <p className="font-display italic text-sm text-[#F5F0E8]">
          {option.name || "New Hotel"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[#D4AF3750] hover:text-dash-error transition-colors"
          >
            <Trash2Icon className="size-3.5" />
          </button>
          {expanded ? (
            <ChevronUpIcon className="size-4 text-[#D4AF3760]" />
          ) : (
            <ChevronDownIcon className="size-4 text-[#D4AF3760]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4! py-4! space-y-3! border-t border-[#D4AF3715]">
          {/* Name */}
          <Field label="Hotel Name *">
            <Input
              value={option.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="The Grand Ashford"
            />
          </Field>

          {/* Stars */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3780]">
              Star Rating
            </label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    onUpdate({ stars: option.stars === n ? undefined : n })
                  }
                  className="flex-1 py-1.5! rounded-lg border font-label text-[11px] transition-all"
                  style={{
                    borderColor: option.stars === n ? "#D4AF3790" : "#D4AF3720",
                    background:
                      option.stars === n ? "#D4AF3715" : "transparent",
                    color: option.stars === n ? "#D4AF37" : "#D4AF3760",
                  }}
                >
                  {"★".repeat(n)}
                </button>
              ))}
            </div>
          </div>

          <Field label="Description">
            <Textarea
              value={option.description ?? ""}
              onChange={({ target }) => onUpdate({ description: target.value })}
              placeholder="A charming boutique hotel in the village."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price / Night">
              <Input
                value={option.pricePerNight ?? ""}
                onChange={({ target }) =>
                  onUpdate({ pricePerNight: target.value })
                }
                placeholder="£180/night"
              />
            </Field>
            <Field label="Distance">
              <Input
                value={option.distanceFromVenue ?? ""}
                onChange={({ target }) =>
                  onUpdate({ distanceFromVenue: target.value })
                }
                placeholder="10 min drive"
              />
            </Field>
          </div>

          <Field label="Address">
            <Input
              value={option.address ?? ""}
              onChange={({ target }) => onUpdate({ address: target.value })}
              placeholder="1 Ashford Lane, Tuscany"
            />
          </Field>

          <Field label="Booking URL">
            <Input
              value={option.bookingUrl ?? ""}
              onChange={({ target }) => onUpdate({ bookingUrl: target.value })}
              placeholder="https://..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Booking Deadline">
              <DatePicker
                value={option.bookingDeadline ?? ""}
                onChange={(val) => onUpdate({ bookingDeadline: val })}
                placeholder="Select deadline date"
              />
            </Field>
            <Field label="Group Code">
              <Input
                value={option.blockCode ?? ""}
                onChange={({ target }) => onUpdate({ blockCode: target.value })}
                placeholder="WEDDING2026"
              />
            </Field>
          </div>

          <Field label="Phone">
            <Input
              value={option.phone ?? ""}
              onChange={({ target }) => onUpdate({ phone: target.value })}
              placeholder="+44 1234 567890"
            />
          </Field>

          <Field label="Hotel Photo">
            <ImageUploadField
              value={option.imageUrl}
              onChange={(url) => onUpdate({ imageUrl: url })}
              hint="Upload or pick a hotel photo"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

export function AccommodationEditor({ config, onChange }: Props) {
  const acc = config.accommodation ?? DEFAULT_CONFIG;

  const update = (patch: Partial<AccommodationConfig>) =>
    onChange({ accommodation: { ...acc, ...patch } });

  const addOption = () =>
    update({ options: [...acc.options, DEFAULT_OPTION()] });

  const updateOption = (id: string, patch: Partial<AccommodationOption>) =>
    update({
      options: acc.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });

  const deleteOption = (id: string) =>
    update({ options: acc.options.filter((o) => o.id !== id) });

  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <SectionToggle
        label="Accommodation"
        enabled={config.accommodationEnabled ?? false}
        onToggle={() =>
          onChange({ accommodationEnabled: !config.accommodationEnabled })
        }
      />

      {config.accommodationEnabled && (
        <>
          {/* Intro text */}
          <div className="space-y-1.5!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Intro Message
            </label>
            <Textarea
              value={acc.intro ?? ""}
              onChange={({ target }) => update({ intro: target.value })}
              placeholder="We've arranged preferential rates at the following hotels…"
            />
          </div>

          <div className="h-px bg-[#D4AF3715]" />

          {/* Hotel list */}
          <div className="space-y-3!">
            {acc.options.map((option) => (
              <OptionEditor
                key={option.id}
                option={option}
                onUpdate={(patch) => updateOption(option.id, patch)}
                onDelete={() => deleteOption(option.id)}
              />
            ))}
          </div>

          <button
            onClick={addOption}
            className="w-full flex items-center justify-center gap-2 py-3! rounded-xl border border-dashed font-label text-[11px] tracking-[0.3em] uppercase transition-all hover:border-[#D4AF37] cursor-pointer"
            style={{ borderColor: "#D4AF3760", color: "#D4AF3780" }}
          >
            <PlusIcon className="size-3.5" />
            Add Hotel
          </button>
        </>
      )}
    </div>
  );
}
