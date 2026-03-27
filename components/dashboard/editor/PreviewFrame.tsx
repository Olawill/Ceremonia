"use client";

import { useEffect, useRef, useState } from "react";

import { buildSections } from "@/lib/eventSections";
import type { EventConfig } from "@/types/event";
import clsx from "clsx";
import { RefreshCwIcon } from "lucide-react";

interface Props {
  config: EventConfig;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewLocked?: boolean;
}

function buildUrl(config: EventConfig): string {
  return `/event/preview?initial=${encodeURIComponent(
    btoa(
      Array.from(new TextEncoder().encode(JSON.stringify(config)))
        .map((b) => String.fromCharCode(b))
        .join(""),
    ),
  )}`;
}

export function PreviewFrame({
  config,
  iframeRef,
  previewLocked = false,
}: Props) {
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [registryItemCount, setRegistryItemCount] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (!config.registryEnabled || !config.slug) return;
    fetch(`/api/registry/public/${config.slug}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: unknown[]) =>
        setRegistryItemCount(Array.isArray(items) ? items.length : 0),
      )
      .catch(() => setRegistryItemCount(0));
  }, [config.registryEnabled, config.slug]);

  // Freeze the src on first mount — never change it, use postMessage for all updates
  const frozenSrcRef = useRef<string | null>(null);

  if (frozenSrcRef.current === null) {
    frozenSrcRef.current = buildUrl(config);
  }

  // Capture the initial URL once on mount — never changes, so the iframe
  // never remounts and curtain/scratch state is preserved across edits
  const initialUrl = useRef(buildUrl(config));

  // Track structural fields that require a hard iframe reload when changed
  const prevEntryStyleRef = useRef(config.entryStyle ?? "curtain");
  const prevNavModeRef = useRef(config.navMode ?? "scroll");

  // Send config to the iframe via postMessage whenever it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      { type: "PREVIEW_CONFIG", config, previewLocked },
      "*",
    );
  }, [config]);

  // Hard-reload the iframe when entry style or nav mode changes — these are
  // structural: the curtain/envelope has already played out, so a postMessage
  // update would leave the iframe in a broken half-open state.
  useEffect(() => {
    const newEntryStyle = config.entryStyle ?? "curtain";
    const newNavMode = config.navMode ?? "scroll";

    const entryChanged = newEntryStyle !== prevEntryStyleRef.current;
    const navChanged = newNavMode !== prevNavModeRef.current;

    if (!entryChanged && !navChanged) return;

    // Update refs before reloading so the next render doesn't re-trigger
    prevEntryStyleRef.current = newEntryStyle;
    prevNavModeRef.current = newNavMode;

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset local state — the iframe will be fresh
    setCurtainOpen(false);
    setDateRevealed(false);

    // Rebuild the URL with the latest config baked in, then reload
    initialUrl.current = buildUrl(config);

    setIsLoading(true);
    iframe.src = initialUrl.current;
  }, [config.entryStyle, config.navMode]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "CURTAIN_OPEN") setCurtainOpen(true);
      if (e.data?.type === "DATE_REVEALED") setDateRevealed(true);
      if (e.data?.type === "PREVIEW_READY") setIsLoading(false);
      if (e.data?.type === "SECTION_CHANGE" && typeof e.data.index === "number")
        setActiveSectionIndex(e.data.index);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handler = () => setIsResetting(true);
    iframe.addEventListener("preview-reset", handler);
    return () => iframe.removeEventListener("preview-reset", handler);
  }, []);

  // When the iframe first loads, push the current config in case
  // the initial URL param was stale or too long
  const handleLoad = () => {
    setCurtainOpen(false);
    setDateRevealed(false);
    setIsLoading(false);
    setIsResetting(false);
    setActiveSectionIndex(0);
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "PREVIEW_CONFIG", config, previewLocked },
        "*",
      );
    }, 300);
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
            {buildSections(
              config,
              dateRevealed,
              () => {},
              registryItemCount,
              config.navMode,
            ).map((s, i) => {
              const isActive = i === activeSectionIndex;

              return (
                <button
                  key={s.key}
                  onClick={() =>
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: "SCROLL_TO", index: i },
                      "*",
                    )
                  }
                  className={clsx(
                    "font-label text-[8px] tracking-[0.2em] uppercase px-2! py-0.5! rounded-full border hover:text-[#D4AF37] hover:border-[#D4AF3790] transition-colors cursor-pointer",
                    isActive
                      ? "border-[#D4AF3790] text-[#D4AF37] bg-[#D4AF3718]"
                      : "border-[#D4AF3760] text-[#D4AF3780] bg-transparent",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative">
        <iframe
          ref={iframeRef}
          src={initialUrl.current}
          className="w-full h-full border-0"
          title="Event Preview"
          onLoad={handleLoad}
        />

        {previewLocked && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]"
            style={{ background: "rgba(5,5,5,0.75)" }}
          >
            <div
              className="rounded-2xl px-8! py-6! flex flex-col items-center gap-3 text-center"
              style={{
                background: "#0A0A0A",
                border: "1px solid #D4AF3730",
                maxWidth: 280,
              }}
            >
              <div
                className="text-2xl mb-1"
                style={{ filter: "drop-shadow(0 0 8px #D4AF3760)" }}
              >
                ✦
              </div>
              <p
                className="font-display italic font-bold text-lg leading-snug"
                style={{ color: "#F5F0E8" }}
              >
                Save first to preview
              </p>
              <p
                className="font-label text-[12px] font-semibold tracking-[0.3em] uppercase leading-relaxed"
                style={{ color: "#D4AF3780" }}
              >
                You can interact with the {config.entryStyle ?? "curtain"} in
                the preview once your event details are saved
              </p>
            </div>
          </div>
        )}

        {isResetting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dash-bg/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <RefreshCwIcon className="size-5 text-[#D4AF37] animate-spin" />
              <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF3780]">
                Resetting…
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay — shown during hard reloads (entry style / nav mode change) */}
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
            style={{ background: "#080808" }}
          >
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "#D4AF3740", borderTopColor: "#D4AF37" }}
            />
            <p
              className="font-label text-[10px] tracking-[0.4em] uppercase"
              style={{ color: "#D4AF3770" }}
            >
              Loading preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
