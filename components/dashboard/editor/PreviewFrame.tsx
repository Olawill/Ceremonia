"use client";

import { useEffect } from "react";

import type { WeddingConfig } from "@/types/wedding";

interface Props {
  config: WeddingConfig;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function PreviewFrame({ config, iframeRef }: Props) {
  // Send config to the iframe via postMessage whenever it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({ type: "PREVIEW_CONFIG", config }, "*");
  }, [config]);

  // The preview URL — uses /wedding/preview which listens for postMessage
  const previewUrl = `/wedding/preview?initial=${encodeURIComponent(
    btoa(
      Array.from(new TextEncoder().encode(JSON.stringify(config)))
        .map((b) => String.fromCharCode(b))
        .join(""),
    ),
  )}`;

  console.log({ previewUrl });

  return (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      className="w-full h-full border-0"
      title="Wedding Preview"
      onLoad={() => {
        // Re-send config after iframe loads
        iframeRef.current?.contentWindow?.postMessage(
          { type: "PREVIEW_CONFIG", config },
          "*",
        );
      }}
    />
  );
}
