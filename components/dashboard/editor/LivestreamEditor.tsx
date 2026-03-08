"use client";

import { RadioIcon } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";
import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function LivestreamEditor({ config, onChange }: Props) {
  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <p className="font-label text-[12px] text-[#D4AF37] font-bold tracking-[0.5em] uppercase">
          Livestream
        </p>
        <button
          onClick={() =>
            onChange({ livestreamEnabled: !config.livestreamEnabled })
          }
          className="font-label text-[10px] tracking-widest uppercase px-3! py-1.5! rounded-full border transition-all cursor-pointer"
          style={{
            borderColor: config.livestreamEnabled ? "#D4AF3790" : "#D4AF3730",
            background: config.livestreamEnabled ? "#D4AF3715" : "transparent",
            color: config.livestreamEnabled ? "#D4AF37" : "#D4AF3760",
          }}
        >
          {config.livestreamEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {config.livestreamEnabled && (
        <>
          <Field
            label="Stream URL"
            hint="Paste a YouTube or Vimeo link — we'll embed it automatically."
          >
            <Input
              value={config.livestreamUrl ?? ""}
              onChange={(e) => onChange({ livestreamUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>

          {/* Live URL preview indicator */}
          {config.livestreamUrl && (
            <div
              className="flex items-center gap-2 px-3! py-2! rounded-lg"
              style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
            >
              <RadioIcon
                className="size-3 shrink-0"
                style={{ color: "#D4AF37" }}
              />
              <p
                className="font-display italic text-xs truncate"
                style={{ color: "#D4AF3790" }}
              >
                {config.livestreamUrl}
              </p>
            </div>
          )}

          <Field
            label="Section Title"
            hint='Defaults to "Watch Live" if left empty.'
          >
            <Input
              value={config.livestreamTitle ?? ""}
              onChange={(e) => onChange({ livestreamTitle: e.target.value })}
              placeholder="Watch Live"
            />
          </Field>

          <Field
            label="Note to Guests"
            hint="Optional — shown below the video."
          >
            <Textarea
              value={config.livestreamNote ?? ""}
              onChange={(e) => onChange({ livestreamNote: e.target.value })}
              placeholder="The stream will go live 30 minutes before the ceremony begins…"
              rows={3}
            />
          </Field>
        </>
      )}
    </div>
  );
}
