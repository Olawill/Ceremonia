"use client";

import { useEffect, useRef, useState } from "react";

import { buildSections } from "@/lib/weddingSections";
import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function buildUrl(config: WeddingConfig): string {
  return `/wedding/preview?initial=${encodeURIComponent(
    btoa(
      Array.from(new TextEncoder().encode(JSON.stringify(config)))
        .map((b) => String.fromCharCode(b))
        .join(""),
    ),
  )}`;
}

function getSectionLabels(
  config: WeddingConfig,
): { label: string; index: number }[] {
  const list = [
    { label: "Opening", always: true },
    { label: "Date Reveal", always: true },
    { label: "Countdown", always: true },
    { label: "Timeline", always: true },
    {
      label: "Gallery",
      always: !!config.photoGalleryEnabled && !!config.galleryPhotos?.length,
    },
    { label: "Venue", always: true },
    {
      label: "Dress Code",
      always: !!config.dressCodeEnabled && !!config.dressCode,
    },
    {
      label: "Accommodation",
      always:
        !!config.accommodationEnabled && !!config.accommodation?.options.length,
    },
    {
      label: "Wedding Party",
      always: !!config.weddingPartyEnabled && !!config.weddingParty?.length,
    },
    { label: "FAQ", always: !!config.faqEnabled && !!config.faq?.length },
    {
      label: "Livestream",
      always: !!config.livestreamEnabled && !!config.livestreamUrl,
    },
    {
      label: "Travel",
      always: !!config.travelGuideEnabled && !!config.travelItems?.length,
    },
    { label: "Menu", always: true },
    { label: "RSVP", always: !!config.rsvpEnabled },
    { label: "Registry", always: !!config.registryEnabled },
    { label: "Guestbook", always: !!config.guestBookEnabled },
    { label: "Finale", always: true },
  ];
  return list
    .filter((s) => s.always)
    .map((s, i) => ({ label: s.label, index: i }));
}

export function PreviewFrame({ config, iframeRef }: Props) {
  const [curtainOpen, setCurtainOpen] = useState(false);

  // Capture the initial URL once on mount — never changes, so the iframe
  // never remounts and curtain/scratch state is preserved across edits
  const initialUrl = useRef(buildUrl(config));

  // Send config to the iframe via postMessage whenever it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({ type: "PREVIEW_CONFIG", config }, "*");
  }, [config]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "CURTAIN_OPEN") setCurtainOpen(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // When the iframe first loads, push the current config in case
  // the initial URL param was stale or too long
  const handleLoad = () => {
    setCurtainOpen(false);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "PREVIEW_CONFIG", config },
      "*",
    );
  };

  // Hard reset — rebuilds URL from current config and remounts iframe
  const handleReset = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    initialUrl.current = buildUrl(config);
    iframe.src = initialUrl.current;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section jump bar */}
      {curtainOpen && (
        <div className="shrink-0 px-3! py-1.5! border-b border-[#D4AF3762] flex items-center gap-2">
          <span className="font-label text-[9px] tracking-[0.3em] uppercase text-[#D4AF3780] shrink-0">
            Jump to
          </span>
          <div className="flex gap-1 flex-wrap">
            {buildSections(config, true, () => {}).map((s, i) => (
              <button
                key={s.key}
                onClick={() =>
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: "SCROLL_TO", index: i },
                    "*",
                  )
                }
                className="font-label text-[8px] tracking-[0.2em] uppercase px-2! py-0.5! rounded-full border border-[#D4AF3760] text-[#D4AF3780] hover:text-[#D4AF37] hover:border-[#D4AF3780] transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          // src={previewUrl}
          src={initialUrl.current}
          className="w-full h-full border-0"
          title="Wedding Preview"
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}
