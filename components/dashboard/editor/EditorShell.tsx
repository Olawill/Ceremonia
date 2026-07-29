"use client";

import { useAuth } from "@clerk/nextjs";
import clsx from "clsx";
import {
  AlertCircleIcon,
  CheckIcon,
  DockIcon,
  EyeIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import type { EventConfig } from "@/types/event";
import { DEMO_EVENT_CONFIG, EventType } from "@/types/event";

import { EditorSidebar } from "@/components/dashboard/editor/EditorSidebar";
import { NewEventDialog } from "@/components/dashboard/editor/NewEventDialog";
import { PreviewFrame } from "@/components/dashboard/editor/PreviewFrame";

import { useNavigationBlocker } from "@/contexts/NavigationGuardContext";

interface RoomsCredits {
  freeRemaining: number;
  purchasedRemaining: number;
  totalRemaining: number;
}

interface Props {
  initialConfig: EventConfig | null;
  isNew: boolean;
}

interface NewEventValues {
  eventType: EventType;
  host1Name: string;
  host2Name?: string;
  date: string;
  notificationEmail?: string | undefined;
}

export function EditorShell({ initialConfig, isNew }: Props) {
  const { api } = useApi();
  const { getToken } = useAuth();
  const { toast, handleApiError } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Live config state — every sidebar change updates this
  const [config, setConfig] = useState<EventConfig>(
    initialConfig ?? { ...DEMO_EVENT_CONFIG, id: "", slug: "" },
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isDirty, setIsDirty] = useState(false);

  const { setIsBlocked } = useNavigationBlocker();

  const [showDialog, setShowDialog] = useState(isNew);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [roomsCredits, setRoomsCredits] = useState<RoomsCredits | null>(null);

  // Undock/dock state — preview can be popped into its own window on desktop
  const [isUndocked, setIsUndocked] = useState(false);
  const undockedWindowRef = useRef<Window | null>(null);

  const hasOpenedPreviewRef = useRef(false);
  const hasEverSavedRef = useRef(!isNew); // true for existing events, false for brand new ones

  // Pending local files waiting to be uploaded on Save
  // key = config field name (e.g. "heroPhotoUrl"), value = File object
  const pendingFilesRef = useRef<Map<string, File | string>>(new Map());

  useEffect(() => {
    setIsBlocked(isDirty);
  }, [isDirty, setIsBlocked]);

  // Prevent body scroll when preview sheet is open
  useEffect(() => {
    document.body.style.overflow = previewOpen ? "hidden" : "";

    if (previewOpen) {
      hasOpenedPreviewRef.current = true;
    }

    let rafId: number | null = null;

    // When closing the preview sheet, stop any playing audio/video in the iframe
    // by blanking then restoring the src — cleanest cross-origin safe approach
    if (
      !previewOpen &&
      hasOpenedPreviewRef.current &&
      previewIframeRef.current
    ) {
      const iframe = previewIframeRef.current;
      const currentSrc = iframe.src;
      iframe.src = "about:blank";
      // Restore after a tick so the iframe remounts fresh when reopened
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (previewIframeRef.current) {
          // iframe.src = currentSrc;
          previewIframeRef.current.src = currentSrc;
        }
      });
    }

    return () => {
      document.body.style.overflow = "";
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [previewOpen]);

  const updateConfig = useCallback((patch: Partial<EventConfig>) => {
    const resolved: Partial<EventConfig> = {};

    for (const [key, value] of Object.entries(patch) as [
      keyof EventConfig,
      EventConfig[keyof EventConfig],
    ][]) {
      if (value instanceof File) {
        const localUrl = URL.createObjectURL(value);
        pendingFilesRef.current.set(key, value);
        resolved[key] = localUrl as never;
      } else if (
        Array.isArray(value) &&
        value.some(
          (v) =>
            typeof v === "string" &&
            (v.startsWith("http://") || v.startsWith("https://")) &&
            !v.includes("vercel-storage.com"),
        )
      ) {
        value.forEach((v, i) => {
          if (
            typeof v === "string" &&
            (v.startsWith("http://") || v.startsWith("https://")) &&
            !v.includes("vercel-storage.com")
          ) {
            pendingFilesRef.current.set(`${key}[${i}]__url`, v);
          }
        });
        resolved[key] = value as never;
      } else if (
        typeof value === "string" &&
        (value.startsWith("http://") || value.startsWith("https://")) &&
        !value.includes("vercel-storage.com") &&
        !value.startsWith("blob:")
      ) {
        pendingFilesRef.current.set(`${key}__url`, value);
        resolved[key] = value as never;
      } else {
        resolved[key] = value as never;
      }
    }

    setConfig((prev) => ({ ...prev, ...resolved }));
    setIsDirty(true);
  }, []);

  // Undock the preview into a popup window
  const handleUndock = useCallback(() => {
    const encoded = btoa(
      Array.from(new TextEncoder().encode(JSON.stringify(config)))
        .map((b) => String.fromCharCode(b))
        .join(""),
    );
    const w = window.open(
      `/event/preview?initial=${encodeURIComponent(encoded)}`,
      "_blank",
      "width=1200,height=800,menubar=no,toolbar=no",
    );
    if (w) {
      undockedWindowRef.current = w;
      setIsUndocked(true);
    }
  }, [config]);

  // Dock the preview back — close the undocked window and restore inline preview
  const handleDock = useCallback(() => {
    undockedWindowRef.current?.close();
    undockedWindowRef.current = null;
    setIsUndocked(false);
    setPreviewOpen(true);
  }, []);

  // When navigating away (route change), auto-dock — close the undocked window and restore inline preview
  useEffect(() => {
    const handleBeforeUnload = () => {
      undockedWindowRef.current?.close();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // When the undocked window is closed by the user (e.g. clicking X), dock back automatically
  useEffect(() => {
    if (!isUndocked || !undockedWindowRef.current) return;

    const pollClosed = setInterval(() => {
      if (undockedWindowRef.current?.closed) {
        clearInterval(pollClosed);
        undockedWindowRef.current = null;
        setIsUndocked(false);
        setPreviewOpen(true);
      }
    }, 300);

    return () => clearInterval(pollClosed);
  }, [isUndocked]);

  // Sync config to undocked window whenever it changes
  useEffect(() => {
    if (!isUndocked || !undockedWindowRef.current) return;
    undockedWindowRef.current.postMessage(
      { type: "PREVIEW_CONFIG", config, previewLocked: false },
      "*",
    );
  }, [config, isUndocked]);

  // useEffect(() => {
  //   const handler = (e: BeforeUnloadEvent) => {
  //     if (!isDirty) return;
  //     e.preventDefault();
  //   };
  //   window.addEventListener("beforeunload", handler);
  //   return () => window.removeEventListener("beforeunload", handler);
  // }, [isDirty]);

  const handleNewEventConfirm = useCallback((values: NewEventValues) => {
    setConfig((prev) => ({
      ...prev,
      eventType: values.eventType,
      // Keep bride/groom populated for backwards compat with DB columns + ContentEditor
      bride: values.host1Name,
      groom: values.host2Name ?? "",
      date: values.date,
      notificationEmail: values.notificationEmail ?? "",
    }));
    setShowDialog(false);
    setIsDirty(false);
  }, []);

  const handleHardReset = useCallback(() => {
    const isRooms = (config.navMode ?? "scroll") === "rooms";

    // When undocked, always postMessage to the popup — both rooms and scroll mode
    if (isUndocked && undockedWindowRef.current) {
      undockedWindowRef.current.postMessage({ type: "RESET_PREVIEW" }, "*");
      return;
    }

    if (isRooms) {
      // Docked rooms mode — post to same window (PreviewFrame inline listener)
      window.postMessage({ type: "RESET_PREVIEW" }, "*");
      return;
    }

    // Scroll mode: also reset the iframe if it exists
    const iframe = previewIframeRef.current;
    if (!iframe) return;

    // Dispatch a custom event that PreviewFrame listens for
    iframe.dispatchEvent(new CustomEvent("preview-reset"));
    iframe.src = `/event/preview?initial=${encodeURIComponent(
      btoa(
        Array.from(new TextEncoder().encode(JSON.stringify(config)))
          .map((b) => String.fromCharCode(b))
          .join(""),
      ),
    )}`;
  }, [config, isUndocked]);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const resolvedConfig = { ...config };

      if (pendingFilesRef.current.size > 0) {
        setSaveState("saving");
        for (const [key, value] of pendingFilesRef.current.entries()) {
          if (key.endsWith("__url") && !key.includes("[")) {
            // Single external URL field — proxy through from-url
            const field = key.replace("__url", "") as keyof EventConfig;
            const token = await getToken();
            const res = await fetch("/api/upload/from-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                url: value as string,
                type: field.includes("audio") ? "audio" : "photo",
              }),
            });
            const data = (await res.json()) as {
              url?: string;
              message?: string;
            };
            if (!res.ok) {
              toast.error(data.message ?? "Failed to upload media");
              setSaveState("error");
              return;
            }
            resolvedConfig[field] = data.url as never;
          } else if (!key.endsWith("__url")) {
            // Local File object — upload directly
            const field = key as keyof EventConfig;
            if (!(value instanceof File)) continue;
            const { data, error } = await api.upload.post({
              file: value,
              type: field.includes("audio") ? "audio" : "photo",
            });
            if (error || !data?.url) {
              toast.error("Failed to upload media");
              setSaveState("error");
              return;
            }
            // Revoke the temporary object URL before overwriting
            const existing = resolvedConfig[field];
            if (typeof existing === "string" && existing.startsWith("blob:")) {
              URL.revokeObjectURL(existing);
            }
            resolvedConfig[field] = data.url as never;
          }
        }
        // Update config with real Blob URLs and clear pending
        setConfig(resolvedConfig);
        pendingFilesRef.current.clear();
      }

      // Resolve pending gallery photo URLs — proxy each external URL
      const galleryPhotoKeys = [...pendingFilesRef.current.keys()].filter(
        (k) => k.startsWith("galleryPhotos[") && k.endsWith("__url"),
      );

      if (galleryPhotoKeys.length > 0) {
        const resolvedPhotos = [...(resolvedConfig.galleryPhotos ?? [])];
        for (const key of galleryPhotoKeys) {
          const match = key.match(/galleryPhotos\[(\d+)\]__url/);
          if (!match) continue;
          const idx = parseInt(match[1], 10);
          const rawUrl = pendingFilesRef.current.get(key);
          if (typeof rawUrl !== "string") continue;
          const token = await getToken();
          const res = await fetch("/api/upload/from-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url: rawUrl, type: "photo" }),
          });
          const data = (await res.json()) as { url?: string; message?: string };
          if (!res.ok) {
            toast.error(data.message ?? "Failed to upload gallery photo");
            setSaveState("error");
            return;
          }
          if (data.url) resolvedPhotos[idx] = data.url;
        }
        resolvedConfig.galleryPhotos = resolvedPhotos;
      }

      const payload = {
        eventType: config.eventType,
        bride: config.bride,
        groom: config.groom,
        tagLine: config.tagLine,
        finaleTagLine: config.finaleTagLine,
        date: config.date,
        venueDetails: config.venueDetails,
        themeKey: config.themeKey,
        curtainStyle: config.curtainStyle,
        audioUrl: resolvedConfig.audioUrl,
        heroPhotoUrl: resolvedConfig.heroPhotoUrl,
        timeline: config.timeline,
        menuCourses: config.menuCourses,
        rsvpEnabled: config.rsvpEnabled,
        rsvpDeadline: config.rsvpDeadline,
        published: config.published,
        passwordProtected: config.passwordProtected,
        password: config.password,
        notificationEmail: config.notificationEmail,
        guestBookEnabled: config.guestBookEnabled,
        dressCodeEnabled: config.dressCodeEnabled,
        dressCode: config.dressCode,
        accommodationEnabled: config.accommodationEnabled,
        accommodation: config.accommodation,
        eventPartyEnabled: config.eventPartyEnabled,
        eventParty: config.eventParty,
        faqEnabled: config.faqEnabled,
        faq: config.faq,
        livestreamEnabled: config.livestreamEnabled,
        livestreamUrl: config.livestreamUrl,
        livestreamTitle: config.livestreamTitle,
        livestreamNote: config.livestreamNote,
        photoGalleryEnabled: config.photoGalleryEnabled,
        // TODO: galleryPhotos array items may also be pending external URLs —
        // resolve each item through from-url before saving if not already a Blob URL
        galleryPhotos: resolvedConfig.galleryPhotos,
        travelGuideEnabled: config.travelGuideEnabled,
        travelItems: config.travelItems,
        navMode: config.navMode,
        featureMode: config.featureMode,
      } satisfies Parameters<typeof api.events.post>[0];

      if (isNew) {
        const { data, error } = await api.events.post(payload);
        if (error) {
          handleApiError(error, "Failed to create event");
          throw error;
        }
        setSaveState("saved");
        hasEverSavedRef.current = true;
        toast.success("Event created!");
        posthog.capture("event_created", {
          slug: data!.slug,
          bride: config.bride,
          groom: config.groom,
          theme_key: config.themeKey,
        });
        // Navigate to the new slug so the URL is correct
        startTransition(() => {
          setIsDirty(false);
          router.replace(`/app/editor/${data!.slug}`);
        });
      } else {
        const res = await api.events({ slug: config.slug }).patch(payload);

        // Handle 403 from rooms credit exhaustion — revert navMode to scroll
        if (res.error?.status === 403) {
          setConfig((prev) => ({ ...prev, navMode: "scroll" }));
          handleApiError(
            res.error,
            "No rooms credits remaining. Purchase a 5-credit pack to enable 3D rooms.",
          );
          setSaveState("idle");
          return;
        }

        if (res.error) {
          handleApiError(res.error, "Failed to save event");
          throw res.error;
        }

        // Update rooms credits balance from the save response
        if (res.data?.roomsCredits) {
          setRoomsCredits(res.data.roomsCredits);
        }
        setSaveState("saved");
        setIsDirty(false);
        toast.success("Changes saved");
        posthog.capture("event_saved", {
          slug: config.slug,
          published: config.published,
          theme_key: config.themeKey,
          rsvp_enabled: config.rsvpEnabled,
          password_protected: config.passwordProtected,
        });
        // Trigger ISR revalidation
        // startTransition(() => router.refresh());
      }
    } catch (err) {
      posthog.captureException(err, {
        event_name: "event_save_failed",
        properties: { is_new: isNew },
      });
      setSaveState("error");
    } finally {
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  return (
    <>
      <NewEventDialog open={showDialog} onConfirm={handleNewEventConfirm} />

      <div className="flex h-full overflow-hidden space-x-2!">
        {/* Left — controls */}
        <div className="flex-1 shrink-0 flex flex-col border-r overflow-hidden border-[#D4AF3718]">
          {/* Editor header */}
          <div className="px-6! py-4! border-b flex items-center justify-between gap-2 shrink-0 border-[#D4AF3718]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display italic text-[#F5F0E8] text-xl! truncate">
                  {config.groom
                    ? `${config.bride || "Host"} & ${config.groom}`
                    : config.bride || "Your Event"}
                </p>
                <span
                  className={clsx(
                    "font-label text-[9px] tracking-widest uppercase text-[#D4AF3790] border-[#D4AF3780] transition-opacity",
                    (isDirty && saveState === "idle") ||
                      (isNew && saveState !== "saved")
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none",
                  )}
                >
                  Unsaved
                </span>
              </div>
              <p
                className={clsx(
                  "font-label text-[10px] text-[#D4AF3780] tracking-widest truncate",
                  isNew && "hidden",
                )}
              >
                {config.slug}.ceremonia.app
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSave}
                disabled={saveState === "saving"}
                className="font-label text-[11px] tracking-[0.3em] uppercase p-2.5!
                      rounded-full border transition-all flex items-center gap-1.5"
                style={{
                  borderColor: saveState === "error" ? "#ff4444" : "#D4AF3760",
                  color:
                    saveState === "saved"
                      ? "#4ade80"
                      : saveState === "error"
                        ? "#ff4444"
                        : "#D4AF37",
                  background: "#D4AF3710",
                  opacity: saveState === "saving" ? 0.6 : 1,
                }}
              >
                {(() => {
                  const states = {
                    saving: (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />{" "}
                        Saving…
                      </>
                    ),
                    saved: (
                      <>
                        <CheckIcon className="size-3.5" /> Saved
                      </>
                    ),
                    error: (
                      <>
                        <AlertCircleIcon className="size-3.5" /> Error
                      </>
                    ),
                    idle: (
                      <>
                        <SaveIcon className="size-3.5" /> Save
                      </>
                    ),
                  } as const;
                  return states[saveState];
                })()}
              </button>

              {/* Preview toggle — mobile only */}
              <button
                onClick={() => setPreviewOpen(true)}
                className="lg:hidden font-label text-[11px] tracking-[0.3em] uppercase p-2.5! rounded-full border border-dash-border-hi text-dash-gold bg-dash-gold/10 flex items-center gap-1.5 transition-all"
              >
                <EyeIcon className="size-3.5" />
                Preview
              </button>
            </div>
          </div>

          {/* Scrollable sidebar */}
          <div className="flex-1 overflow-y-auto">
            <EditorSidebar
              config={config}
              onChange={updateConfig}
              previewIframeRef={previewIframeRef}
              roomsCredits={roomsCredits}
            />
          </div>
        </div>

        {/* Right — preview: full panel on lg+, sheet on smaller screens */}

        {/* Sheet backdrop (mobile/md) */}
        <div
          className={clsx(
            "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            previewOpen && !showDialog
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none invisible",
          )}
          onClick={() => setPreviewOpen(false)}
        />

        {/* Preview panel */}
        <div
          className={clsx(
            // Desktop: normal flex column in layout
            "lg:flex lg:relative lg:translate-x-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:bg-[#050505]",
            // Mobile/md: fixed sheet sliding in from right
            "fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-2xl bg-[#050505]",
            "border-l-2 border-dash-border-hi transition-transform duration-300",
            previewOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
            // Hide entirely when the new event dialog is open
            showDialog && "lg:hidden",
          )}
        >
          <div className="px-6! py-1! border-b border-dash-border/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-label text-[12px] pl-2! font-semibold tracking-widest uppercase text-dash-gold">
                Live Preview
              </span>
              <span
                className={clsx(
                  "font-label text-[12px] font-semibold tracking-widest uppercase text-dash-gold transition-opacity",
                  isPending ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
              >
                Refreshing…
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Undock / Dock button — desktop only */}
              <button
                onClick={handleUndock}
                className={clsx(
                  "lg:flex items-center gap-1.5 font-label font-semibold text-[9px] tracking-[0.3em] uppercase px-2.5! py-1.5! rounded-lg border border-[#D4AF3780] text-[#D4AF3780] hover:text-[#D4AF37] transition-all hover:border-[#D4AF37] cursor-pointer bg-transparent",
                  isUndocked ? "hidden" : "hidden lg:flex",
                )}
                title="Pop the preview into a separate window"
              >
                <Undo2Icon className="size-3" />
                Undock
              </button>
              <button
                onClick={handleDock}
                className={clsx(
                  "items-center gap-1.5 font-label font-semibold text-[9px] tracking-[0.3em] uppercase px-2.5! py-1.5! rounded-lg border border-[#D4AF3780] text-[#D4AF3780] hover:text-[#D4AF37] transition-all hover:border-[#D4AF37] cursor-pointer bg-transparent",
                  isUndocked ? "hidden lg:flex" : "hidden",
                )}
                title="Dock the preview back into this window"
              >
                <DockIcon className="size-3" />
                Dock
              </button>

              {/* Reset preview — reopens curtain from scratch with current config */}
              <button
                onClick={handleHardReset}
                className="flex items-center gap-1.5 font-label font-semibold text-[9px] tracking-[0.3em] uppercase px-2.5! py-1.5! rounded-lg border border-[#D4AF3780] text-[#D4AF3780] hover:text-[#D4AF37] transition-all hover:border-[#D4AF37] cursor-pointer bg-transparent"
                title="Restart the curtain from scratch"
              >
                <RefreshCwIcon className="size-3" />
                Reset
              </button>

              {/* Close button — mobile sheet only */}
              <button
                onClick={() => setPreviewOpen(false)}
                className="lg:hidden flex items-center justify-center size-7 rounded-lg text-dash-text/40 hover:text-dash-gold transition-colors cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden" data-rr-ignore>
            <div
              className={clsx(
                "w-full h-full flex flex-col items-center justify-center gap-4 bg-[#050505]",
                !isUndocked && "hidden",
              )}
            >
              <p
                className="font-label text-[11px] tracking-[0.3em] uppercase"
                style={{ color: "#D4AF3780" }}
              >
                Preview is in a separate window
              </p>
              <button
                onClick={handleDock}
                className="flex items-center gap-2 font-label text-[11px] tracking-[0.3em] uppercase px-4! py-2! rounded-xl border border-[#D4AF3760] text-[#D4AF37] hover:bg-[#D4AF3710] transition-all cursor-pointer"
              >
                <DockIcon className="size-4" />
                Dock Back
              </button>
            </div>
            <div className={clsx("w-full h-full", isUndocked && "hidden")}>
              <PreviewFrame
                config={config}
                iframeRef={previewIframeRef}
                previewLocked={!hasEverSavedRef.current}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function EditorSkeleton() {
  return (
    <div className="flex h-screen bg-dash-bg overflow-hidden">
      {/* Left — sidebar skeleton */}
      <div className="w-80 shrink-0 flex flex-col border-r border-dash-border h-full">
        {/* Header bar */}
        <div className="px-6! py-3! border-b border-dash-border/10 flex items-center justify-between">
          <div className="h-3 w-32 rounded-full bg-dash-surface animate-pulse" />
          <div className="h-7 w-16 rounded-full bg-dash-surface animate-pulse" />
        </div>

        {/* Tab strip */}
        <div className="flex items-end gap-1 border-b border-dash-border/10 px-2! pt-2! overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full bg-dash-surface animate-pulse shrink-0"
              style={{ width: `${28 + (i % 3) * 10}px`, marginBottom: "10px" }}
            />
          ))}
        </div>

        {/* Field skeletons */}
        <div className="flex-1 p-4! space-y-5!">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 w-20 rounded-full bg-dash-surface animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-dash-surface animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Right — preview skeleton */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        {/* Preview header */}
        <div className="px-6! py-2! border-b border-dash-border/10 flex items-center justify-between">
          <div className="h-2.5 w-24 rounded-full bg-dash-surface animate-pulse" />
          <div className="h-6 w-14 rounded-lg bg-dash-surface animate-pulse" />
        </div>

        {/* Preview body — curtain shimmer */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 opacity-20">
            <div className="h-3 w-24 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="h-8 w-48 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="h-2 w-16 rounded-full bg-[#D4AF37] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
