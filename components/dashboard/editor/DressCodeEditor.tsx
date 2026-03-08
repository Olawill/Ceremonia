"use client";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";

import type {
  DressCodeConfig,
  DressCodeStyle,
  WeddingConfig,
} from "@/types/wedding";

const STYLES: { value: DressCodeStyle; label: string; icon: string }[] = [
  { value: "black-tie", label: "Black Tie", icon: "🎩" },
  { value: "black-tie-optional", label: "Black Tie Optional", icon: "🥂" },
  { value: "cocktail", label: "Cocktail", icon: "🍸" },
  { value: "smart-casual", label: "Smart Casual", icon: "✨" },
  { value: "garden-party", label: "Garden Party", icon: "🌸" },
  { value: "beach-formal", label: "Beach Formal", icon: "🌊" },
  { value: "casual", label: "Casual", icon: "☀️" },
];

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
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
      />

      {config.dressCodeEnabled && (
        <>
          {/* Style picker */}
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => update({ style: value })}
                className="flex items-center gap-2 px-3! py-2.5! rounded-xl border font-display italic text-sm transition-all text-left cursor-pointer"
                style={{
                  borderColor: dc.style === value ? "#D4AF3790" : "#D4AF3720",
                  background: dc.style === value ? "#D4AF3712" : "transparent",
                  color: dc.style === value ? "#D4AF37" : "#F5F0E890",
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="h-px bg-[#D4AF3715]" />

          {/* Custom title */}
          <div className="space-y-1.5!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={dc.title ?? ""}
              onChange={(e) => update({ title: e.target.value || undefined })}
              placeholder="e.g. Dress to Impress"
              className="w-full bg-[#F5F0E808] border border-[#D4AF3720] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3740] placeholder:text-[#F5F0E830]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Description
            </label>
            <textarea
              value={dc.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="We invite you to dress in your finest…"
              rows={3}
              className="w-full bg-[#F5F0E808] border border-[#D4AF3720] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3740] placeholder:text-[#F5F0E830] resize-none"
            />
          </div>

          {/* Suggested palette */}
          <div className="space-y-2!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Suggested Palette
            </label>
            <div className="flex flex-wrap gap-2">
              {(dc.colourPalette ?? []).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) =>
                      updateColour("colourPalette", i, e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <button
                    onClick={() => removeColour("colourPalette", i)}
                    className="text-[#D4AF3760] hover:text-[#D4AF37] text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addColour("colourPalette")}
                className="px-3! py-1.5! rounded-lg border border-dashed border-[#D4AF3730] text-[#D4AF3760] font-label text-[10px] tracking-widest hover:border-[#D4AF3760] transition-all cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Avoid colours */}
          <div className="space-y-2!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Colours to Avoid
            </label>
            <div className="flex flex-wrap gap-2">
              {(dc.avoidColours ?? []).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) =>
                      updateColour("avoidColours", i, e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <button
                    onClick={() => removeColour("avoidColours", i)}
                    className="text-[#D4AF3760] hover:text-[#D4AF37] text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addColour("avoidColours")}
                className="px-3! py-1.5! rounded-lg border border-dashed border-[#D4AF3730] text-[#D4AF3760] font-label text-[10px] tracking-widest hover:border-[#D4AF3760] transition-all cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5!">
            <label className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3790]">
              Extra Notes
            </label>
            <textarea
              value={dc.notes ?? ""}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="e.g. Heels not recommended — outdoor venue"
              rows={2}
              className="w-full bg-[#F5F0E808] border border-[#D4AF3720] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3740] placeholder:text-[#F5F0E830] resize-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
