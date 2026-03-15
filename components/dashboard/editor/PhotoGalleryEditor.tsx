"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { ImageUploadField } from "@/components/ui/ImageUploadField";

import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function PhotoGalleryEditor({ config, onChange }: Props) {
  const photos = config.galleryPhotos ?? [];

  const addPhoto = (url: string) =>
    onChange({ galleryPhotos: [...photos, url] });

  const updatePhoto = (index: number, url: string) => {
    const next = [...photos];
    next[index] = url;
    onChange({ galleryPhotos: next });
  };

  const removePhoto = (index: number) =>
    onChange({ galleryPhotos: photos.filter((_, i) => i !== index) });

  return (
    <div className="space-y-6!">
      <SectionToggle
        label="Photo Gallery"
        enabled={config.photoGalleryEnabled ?? false}
        onToggle={() =>
          onChange({ photoGalleryEnabled: !config.photoGalleryEnabled })
        }
        disabledMessage="Enable to showcase a photo gallery on your invitation."
      />

      {config.photoGalleryEnabled && (
        <>
          <p
            className="font-display italic text-xs"
            style={{ color: "#F5F0E860" }}
          >
            Upload photos that will appear in the gallery section of your
            invitation.
          </p>

          <div className="space-y-3!">
            {photos.map((url, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <ImageUploadField
                    value={url}
                    onChange={(newUrl) => {
                      if (newUrl) updatePhoto(i, newUrl);
                    }}
                    hint="Upload or paste a photo URL"
                  />
                </div>
                <button
                  onClick={() => removePhoto(i)}
                  className="mt-1 p-1.5! rounded-lg transition-colors cursor-pointer"
                  style={{ color: "#D4AF3770" }}
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addPhoto("")}
            className="flex items-center gap-2 w-full py-2.5! px-3! rounded-xl border border-dashed font-label text-[11px] tracking-widest uppercase transition-all cursor-pointer"
            style={{ borderColor: "#D4AF3730", color: "#D4AF3770" }}
          >
            <PlusIcon className="size-3.5" />
            Add Photo
          </button>

          {photos.length > 0 && (
            <p
              className="font-display italic text-xs"
              style={{ color: "#F5F0E850" }}
            >
              {photos.filter(Boolean).length} photo
              {photos.filter(Boolean).length !== 1 ? "s" : ""} added
            </p>
          )}
        </>
      )}
    </div>
  );
}
