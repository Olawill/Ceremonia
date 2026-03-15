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

export function PreviewFrame({ config, iframeRef }: Props) {
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);

  // Freeze the src on first mount — never change it, use postMessage for all updates
  const frozenSrcRef = useRef<string | null>(null);

  if (frozenSrcRef.current === null) {
    frozenSrcRef.current = buildUrl(config);
  }

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
      if (e.data?.type === "DATE_REVEALED") setDateRevealed(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // When the iframe first loads, push the current config in case
  // the initial URL param was stale or too long
  const handleLoad = () => {
    setCurtainOpen(false);
    setDateRevealed(false);
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "PREVIEW_CONFIG", config },
        "*",
      );
    }, 300);
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
            {buildSections(config, dateRevealed, () => {}).map((s, i) => (
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
          // src={frozenSrcRef.current}
          className="w-full h-full border-0"
          title="Wedding Preview"
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}
