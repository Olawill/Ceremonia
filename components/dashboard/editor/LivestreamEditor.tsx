"use client";

import { RadioIcon } from "lucide-react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
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
      <SectionToggle
        label="Livestream"
        enabled={config.livestreamEnabled ?? false}
        onToggle={() =>
          onChange({ livestreamEnabled: !config.livestreamEnabled })
        }
      />

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
