"use client";

import { useEffect, useRef } from "react";

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
  // Capture the initial URL once on mount — never changes, so the iframe
  // never remounts and curtain/scratch state is preserved across edits
  const initialUrl = useRef(buildUrl(config));

  // Send config to the iframe via postMessage whenever it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({ type: "PREVIEW_CONFIG", config }, "*");
  }, [config]);

  // When the iframe first loads, push the current config in case
  // the initial URL param was stale or too long
  const handleLoad = () => {
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
    <iframe
      ref={iframeRef}
      // src={previewUrl}
      src={initialUrl.current}
      className="w-full h-full border-0"
      title="Wedding Preview"
      onLoad={handleLoad}
    />
  );
}
