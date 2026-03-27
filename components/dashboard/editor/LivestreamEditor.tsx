"use client";

import { CheckCircleIcon, RadioIcon, XCircleIcon } from "lucide-react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";

import { detectStream, PLATFORM_META } from "@/components/sections/Livestream";
import type { EventConfig } from "@/types/event";
import { getVocabulary } from "@/types/event";

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
}

export function LivestreamEditor({ config, onChange }: Props) {
  const vocab = getVocabulary(config.eventType);

  return (
    <div className="space-y-6!">
      {/* Enable toggle */}
      <SectionToggle
        label="Livestream"
        enabled={config.livestreamEnabled ?? false}
        onToggle={() =>
          onChange({ livestreamEnabled: !config.livestreamEnabled })
        }
        disabledMessage={`Enable to embed a live stream so remote guests can watch your ${vocab.eventLabel.toLowerCase()}.`}
      />

      {config.livestreamEnabled && (
        <>
          <Field
            label="Stream URL"
            hint="YouTube, Vimeo, Twitch, Facebook Live, and Crowdcast embed automatically. Zoom, Teams, Google Meet, and others open in a new tab."
          >
            <Input
              value={config.livestreamUrl ?? ""}
              onChange={(e) => onChange({ livestreamUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>

          {/* Platform detection preview */}
          {config.livestreamUrl &&
            (() => {
              const stream = detectStream(config.livestreamUrl!);
              const meta = PLATFORM_META[stream.platform];
              return (
                <div
                  className="flex flex-col gap-2 px-3! py-3! rounded-lg"
                  style={{
                    background: "#D4AF3708",
                    border: "1px solid #D4AF3720",
                  }}
                >
                  {/* Platform + embed status row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RadioIcon
                        className="size-3 shrink-0"
                        style={{ color: "#D4AF37" }}
                      />
                      <p
                        className="font-label text-[10px] tracking-[0.3em] uppercase font-semibold"
                        style={{ color: "#D4AF37" }}
                      >
                        {meta.label}
                      </p>
                    </div>

                    {/* Embed / external badge */}
                    <div
                      className="flex items-center gap-1 px-2! py-0.5! rounded-full"
                      style={{
                        background: stream.canEmbed ? "#D4AF3715" : "#ffffff08",
                        border: `1px solid ${stream.canEmbed ? "#D4AF3740" : "#ffffff15"}`,
                      }}
                    >
                      {stream.canEmbed ? (
                        <CheckCircleIcon
                          className="size-2.5"
                          style={{ color: "#D4AF37" }}
                        />
                      ) : (
                        <XCircleIcon
                          className="size-2.5"
                          style={{ color: "#ffffff40" }}
                        />
                      )}
                      <span
                        className="font-label text-[8px] tracking-[0.3em] uppercase"
                        style={{
                          color: stream.canEmbed ? "#D4AF3790" : "#ffffff30",
                        }}
                      >
                        {stream.canEmbed ? "Embeds" : "Opens externally"}
                      </span>
                    </div>
                  </div>

                  {/* URL truncated */}
                  <p
                    className="font-display italic text-xs truncate"
                    style={{ color: "#D4AF3760" }}
                  >
                    {config.livestreamUrl}
                  </p>

                  {/* Helpful note for non-embeddable platforms */}
                  {!stream.canEmbed && (
                    <p
                      className="font-label text-[9px] tracking-wide leading-relaxed"
                      style={{ color: "#ffffff35" }}
                    >
                      {meta.note} — guests will see a button to join directly.
                    </p>
                  )}
                </div>
              );
            })()}

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
              placeholder={`The stream will go live 30 minutes before the ${vocab.eventLabel.toLowerCase()} begins…`}
              rows={3}
            />
          </Field>
        </>
      )}
    </div>
  );
}
