"use client";

import clsx from "clsx";
import {
  ImageIcon,
  Loader2Icon,
  MusicIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { useApi } from "@/hooks/useApi";

import { PlanGate } from "@/components/ui/PlanGate";

import type { WeddingConfig } from "@/types/wedding";
import { toast } from "sonner";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

interface UploadFieldProps {
  label: string;
  hint: string;
  accept: string;
  type: "photo" | "audio";
  value: string | undefined;
  icon: React.ReactNode;
  onUpload: (url: string) => void;
  onClear: () => void;
}

function UploadField({
  label,
  hint,
  accept,
  type,
  value,
  icon,
  onUpload,
  onClear,
}: UploadFieldProps) {
  const { api } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { data, error } = await api.upload.post({ file, type });
      if (error) {
        const msg =
          typeof error.value === "object" &&
          error.value !== null &&
          "message" in error.value
            ? (error.value as { message: string }).message
            : "Upload failed";
        if (error.status === 403) {
          toast.warning(msg, {
            description: "Upgrade your plan to unlock this feature.",
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/app/billing"),
            },
          });
        } else {
          toast.error(msg);
        }
        return;
      }
      if (!data?.url) throw new Error("Upload failed");
      onUpload(data.url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2!">
      <p className="font-label text-[11px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">
        {label}
      </p>
      <p className="font-display italic text-sm font-semibold text-[#F5F0E890]">
        {hint}
      </p>

      {value ? (
        // Uploaded — show preview + clear button
        <div className="flex items-center gap-3 rounded-lg border border-[#D4AF3730] bg-[#D4AF3708] px-4 py-3">
          <div className="text-[#D4AF37] shrink-0">{icon}</div>
          {type === "photo" ? (
            <img
              src={value}
              alt="Hero photo"
              className="h-14 w-20 rounded object-cover"
            />
          ) : (
            <audio controls src={value} className="flex-1 h-8" />
          )}
          <button
            onClick={onClear}
            className="ml-auto text-[#D4AF3760] hover:text-[#D4AF37] transition-colors shrink-0"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      ) : (
        // Empty — dropzone
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4AF3730] bg-[#D4AF3705] py-8! cursor-pointer hover:border-[#D4AF3760] hover:bg-[#D4AF370A] transition-colors",
          )}
        >
          {uploading ? (
            <Loader2Icon className="size-5 text-[#D4AF37] animate-spin" />
          ) : (
            <UploadIcon className="size-5 text-[#D4AF3760]" />
          )}
          <span className="font-label text-[10px] tracking-[0.3em] uppercase text-[#D4AF3760]">
            {uploading ? "Uploading…" : "Click or drag to upload"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MediaUploader({ config, onChange }: Props) {
  return (
    <div className="space-y-6!">
      <p className="font-label text-[12px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]">
        Media
      </p>

      {/* Hero Photo — free feature */}
      <UploadField
        label="Hero Photo"
        hint="Shown behind the couple's names. JPG or PNG, max 10MB."
        accept="image/*"
        type="photo"
        value={config.heroPhotoUrl}
        icon={<ImageIcon className="size-4" />}
        onUpload={(url) => onChange({ heroPhotoUrl: url })}
        onClear={() => onChange({ heroPhotoUrl: undefined })}
      />

      <div className="h-px bg-[#D4AF3718]" />

      {/* Custom Audio — Starter+ */}
      <PlanGate requires="starter" featureName="Custom audio">
        <UploadField
          label="Background Music"
          hint="Plays when the invitation opens. MP3 or WAV, max 20MB."
          accept="audio/*"
          type="audio"
          value={config.audioUrl}
          icon={<MusicIcon className="size-4" />}
          onUpload={(url) => onChange({ audioUrl: url })}
          onClear={() => onChange({ audioUrl: undefined })}
        />
      </PlanGate>
    </div>
  );
}
