"use client";

import clsx from "clsx";
import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import { EventType } from "@/types/event";
import type { WeddingConfig } from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

import { EditorSidebar } from "@/components/dashboard/editor/EditorSidebar";
import { NewEventDialog } from "@/components/dashboard/editor/NewEventDialog";
import { PreviewFrame } from "@/components/dashboard/editor/PreviewFrame";

interface Props {
  initialConfig: WeddingConfig | null;
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
  const { toast, handleApiError } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Live config state — every sidebar change updates this
  const [config, setConfig] = useState<WeddingConfig>(
    initialConfig ?? { ...DEMO_WEDDING_CONFIG, id: "", slug: "" },
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isDirty, setIsDirty] = useState(false);

  const [showDialog, setShowDialog] = useState(isNew);
  const [previewOpen, setPreviewOpen] = useState(false);

  const hasOpenedPreviewRef = useRef(false);

  // Prevent body scroll when preview sheet is open
  useEffect(() => {
    document.body.style.overflow = previewOpen ? "hidden" : "";

    if (previewOpen) {
      hasOpenedPreviewRef.current = true;
    }

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
      requestAnimationFrame(() => {
        iframe.src = currentSrc;
      });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [previewOpen]);

  const updateConfig = useCallback((patch: Partial<WeddingConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

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
  }, []);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const payload = {
        bride: config.bride,
        groom: config.groom,
        tagLine: config.tagLine,
        finaleTagLine: config.finaleTagLine,
        date: config.date,
        venueDetails: config.venueDetails,
        themeKey: config.themeKey,
        curtainStyle: config.curtainStyle,
        audioUrl: config.audioUrl,
        heroPhotoUrl: config.heroPhotoUrl,
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
        weddingPartyEnabled: config.weddingPartyEnabled,
        weddingParty: config.weddingParty,
        faqEnabled: config.faqEnabled,
        faq: config.faq,
        livestreamEnabled: config.livestreamEnabled,
        livestreamUrl: config.livestreamUrl,
        livestreamTitle: config.livestreamTitle,
        livestreamNote: config.livestreamNote,
        photoGalleryEnabled: config.photoGalleryEnabled,
        galleryPhotos: config.galleryPhotos,
        travelGuideEnabled: config.travelGuideEnabled,
        travelItems: config.travelItems,
      } satisfies Parameters<typeof api.weddings.post>[0];

      if (isNew) {
        const { data, error } = await api.weddings.post(payload);
        if (error) {
          handleApiError(error, "Failed to create wedding");
          throw error;
        }
        setSaveState("saved");
        setIsDirty(false);
        toast.success("Wedding created!");
        posthog.capture("event_created", {
          slug: data!.slug,
          bride: config.bride,
          groom: config.groom,
          theme_key: config.themeKey,
        });
        // Navigate to the new slug so the URL is correct
        startTransition(() => router.replace(`/app/editor/${data!.slug}`));
      } else {
        const { error } = await api
          .weddings({ slug: config.slug })
          .patch(payload);
        if (error) {
          handleApiError(error, "Failed to save wedding");
          throw error;
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
        startTransition(() => router.refresh());
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
    <div className="flex h-full overflow-hidden space-x-2!">
      {showDialog && <NewEventDialog onConfirm={handleNewEventConfirm} />}

      {/* Left — controls */}
      <div className="flex-1 shrink-0 flex flex-col border-r overflow-hidden border-[#D4AF3718]">
        {/* Editor header */}
        <div className="px-6! py-4! border-b flex items-center justify-between shrink-0 border-[#D4AF3718]">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display italic text-[#F5F0E8] text-xl!">
                {config.groom
                  ? `${config.bride || "Host"} & ${config.groom}`
                  : config.bride || "Your Event"}
              </p>
              {isDirty && saveState === "idle" && (
                <span className="font-label text-[9px] tracking-widest uppercase text-[#D4AF3790] border-[#D4AF3780]">
                  Unsaved
                </span>
              )}
            </div>
            {!isNew && (
              <p className="font-label text-[10px] text-[#D4AF3780] tracking-widest">
                {config.slug}.ceremonia.app
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              {saveState === "saving" && (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <>
                  <CheckIcon className="size-3.5" /> Saved
                </>
              )}
              {saveState === "error" && (
                <>
                  <AlertCircleIcon className="size-3.5" /> Error
                </>
              )}
              {saveState === "idle" && (
                <>
                  <SaveIcon className="size-3.5" /> Save
                </>
              )}
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
          />
        </div>
      </div>

      {/* Right — preview: full panel on lg+, sheet on smaller screens */}

      {/* Sheet backdrop (mobile/md) */}
      {previewOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        />
      )}

      {/* Preview panel */}
      <div
        className={clsx(
          // Desktop: normal flex column in layout
          "lg:flex lg:relative lg:translate-x-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:bg-[#050505]",
          // Mobile/md: fixed sheet sliding in from right
          "fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-2xl bg-[#050505]",
          "border-l-2 border-dash-border-hi transition-transform duration-300",
          previewOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-6! py-1! border-b border-dash-border/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-label text-[12px] pl-2! font-semibold tracking-widest uppercase text-dash-gold">
              Live Preview
            </span>
            {isPending && (
              <span className="font-label text-[12px] font-semibold tracking-widest uppercase text-dash-gold">
                Refreshing…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Reset preview — reopens curtain from scratch with current config */}
            <button
              onClick={() => {
                const iframe = previewIframeRef.current;
                if (!iframe) return;
                iframe.src = `/eventpreview?initial=${encodeURIComponent(
                  btoa(
                    Array.from(new TextEncoder().encode(JSON.stringify(config)))
                      .map((b) => String.fromCharCode(b))
                      .join(""),
                  ),
                )}`;
              }}
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
        <div className="flex-1 overflow-hidden">
          <PreviewFrame config={config} iframeRef={previewIframeRef} />
        </div>
      </div>
    </div>
  );
}
