"use client";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { getVocabulary } from "@/types/event";

import type {
  DressCodeConfig,
  DressCodeStyle,
  EventConfig,
} from "@/types/event";

const STYLES: {
  value: DressCodeStyle;
  label: string;
  icon: string;
  group: string;
}[] = [
  // Western
  { value: "black-tie", label: "Black Tie", icon: "🎩", group: "Western" },
  {
    value: "black-tie-optional",
    label: "Black Tie Optional",
    icon: "🥂",
    group: "Western",
  },
  { value: "cocktail", label: "Cocktail", icon: "🍸", group: "Western" },
  {
    value: "smart-casual",
    label: "Smart Casual",
    icon: "✨",
    group: "Western",
  },
  {
    value: "garden-party",
    label: "Garden Party",
    icon: "🌸",
    group: "Western",
  },
  {
    value: "beach-formal",
    label: "Beach Formal",
    icon: "🌊",
    group: "Western",
  },
  { value: "casual", label: "Casual", icon: "☀️", group: "Western" },
  // Cultural
  {
    value: "african-formal",
    label: "African Formal",
    icon: "🪘",
    group: "Cultural",
  },
  {
    value: "south-asian-formal",
    label: "South Asian Formal",
    icon: "🪷",
    group: "Cultural",
  },
  {
    value: "east-asian-formal",
    label: "East Asian Formal",
    icon: "🏮",
    group: "Cultural",
  },
  {
    value: "middle-eastern",
    label: "Middle Eastern",
    icon: "🌙",
    group: "Cultural",
  },
  {
    value: "latin-formal",
    label: "Latin Formal",
    icon: "🌺",
    group: "Cultural",
  },
  {
    value: "smart-traditional",
    label: "Smart Traditional",
    icon: "🤝",
    group: "Cultural",
  },
  { value: "traditional", label: "Traditional", icon: "👘", group: "Cultural" },
];

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
}

const DEFAULT_DRESS_CODE: DressCodeConfig = {
  style: "cocktail",
  description: "",
  colourPalette: [],
  avoidColours: [],
  notes: "",
};

export function DressCodeEditor({ config, onChange }: Props) {
  const dc = config.dressCode ?? DEFAULT_DRESS_CODE;
  const vocab = getVocabulary(config.eventType);

  const update = (patch: Partial<DressCodeConfig>) =>
    onChange({ dressCode: { ...dc, ...patch } });

  const addColour = (field: "colourPalette" | "avoidColours") => {
    const current = dc[field] ?? [];
    update({ [field]: [...current, "#ffffff"] });
  };

  const updateColour = (
    field: "colourPalette" | "avoidColours",
    index: number,
    value: string,
  ) => {
    const current = [...(dc[field] ?? [])];
    current[index] = value;
    update({ [field]: current });
  };

  const removeColour = (
    field: "colourPalette" | "avoidColours",
    index: number,
  ) => {
    const current = [...(dc[field] ?? [])];
    current.splice(index, 1);
    update({ [field]: current });
  };

  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <SectionToggle
        label="Dress Code"
        enabled={config.dressCodeEnabled ?? false}
        onToggle={() =>
          onChange({ dressCodeEnabled: !config.dressCodeEnabled })
        }
        disabledMessage={`Enable to share the ${vocab.attireLabel.toLowerCase()} and colour palette with your guests.`}
      />

      {config.dressCodeEnabled && (
        <>
          {/* Style picker */}
          {(["Western", "Cultural"] as const).map((group) => (
            <div key={group} className="space-y-2!">
              <p className="font-label text-[10px] font-semibold tracking-[0.4em] uppercase text-[#D4AF3790]">
                {group}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.filter((s) => s.group === group).map(
                  ({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => update({ style: value })}
                      className="flex items-center gap-2 px-3! py-2.5! rounded-xl border font-display italic text-sm transition-all text-left cursor-pointer"
                      style={{
                        borderColor:
                          dc.style === value ? "#D4AF3790" : "#D4AF3740",
                        background:
                          dc.style === value ? "#D4AF3712" : "transparent",
                        color: dc.style === value ? "#D4AF37" : "#F5F0E890",
                      }}
                    >
                      <span>{icon}</span> {label}
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="h-px bg-[#D4AF3715]" />

          {/* Custom title */}
          <div className="space-y-1.5!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={dc.title ?? ""}
              onChange={(e) => update({ title: e.target.value || undefined })}
              placeholder="e.g. Dress to Impress"
              className="w-full bg-[#F5F0E808] border border-[#D4AF3760] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3780] placeholder:text-[#F5F0E830]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Description
            </label>
            <textarea
              value={dc.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="We invite you to dress in your finest…"
              rows={3}
              className="w-full bg-[#F5F0E808] border border-[#D4AF3760] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3780] placeholder:text-[#F5F0E830] resize-none"
            />
          </div>

          {/* Suggested palette */}
          <div className="space-y-2!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Suggested Palette
            </label>
            <div className="flex flex-wrap gap-2">
              {(dc.colourPalette ?? []).map((c, i) => (
                <div key={i} className="relative group">
                  <div
                    className="size-9 rounded-lg border border-[#D4AF3730] cursor-pointer shrink-0"
                    style={{ background: c }}
                    onClick={() =>
                      document.getElementById(`palette-color-${i}`)?.click()
                    }
                  />
                  <input
                    id={`palette-color-${i}`}
                    type="color"
                    value={c}
                    onChange={(e) =>
                      updateColour("colourPalette", i, e.target.value)
                    }
                    className="sr-only"
                  />
                  {/* Remove — appears on hover */}
                  <button
                    onClick={() => removeColour("colourPalette", i)}
                    className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#0A0A0A] border border-[#D4AF3760] text-[#D4AF3770] hover:text-dash-error hover:border-[#ff6b6b90] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-[9px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add swatch */}
              <button
                onClick={() => addColour("colourPalette")}
                className="size-9 rounded-lg border border-dashed border-[#D4AF3780] text-[#D4AF3770] hover:border-[#D4AF37] hover:text-[#D4AF3790] transition-all flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Avoid colours */}
          <div className="space-y-2!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Colours to Avoid
            </label>
            <div className="flex flex-wrap gap-2">
              {(dc.avoidColours ?? []).map((c, i) => (
                <div key={i} className="relative group">
                  <div
                    className="size-9 rounded-lg border border-[#D4AF3770] cursor-pointer shrink-0"
                    style={{ background: c }}
                    onClick={() =>
                      document.getElementById(`palette-color-${i}`)?.click()
                    }
                  />
                  <input
                    id={`palette-color-${i}`}
                    type="color"
                    value={c}
                    onChange={(e) =>
                      updateColour("colourPalette", i, e.target.value)
                    }
                    className="sr-only"
                  />
                  {/* Remove — appears on hover */}
                  <button
                    onClick={() => removeColour("colourPalette", i)}
                    className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#0A0A0A] border border-[#D4AF3760] text-[#D4AF3770] hover:text-dash-error hover:border-[#ff6b6b90] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-[9px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addColour("avoidColours")}
                className="size-9 rounded-lg border border-dashed border-[#D4AF3780] text-[#D4AF3770] hover:border-[#D4AF37] hover:text-[#D4AF3790] transition-all flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5!">
            <label className="font-label font-semibold text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Extra Notes
            </label>
            <textarea
              value={dc.notes ?? ""}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="e.g. Heels not recommended — outdoor venue"
              rows={2}
              className="w-full bg-[#F5F0E808] border border-[#D4AF3760] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3780] placeholder:text-[#F5F0E830] resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
