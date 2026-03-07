"use client";

import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  Loader2Icon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import type { WeddingConfig } from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

import { EditorSidebar } from "@/components/dashboard/editor/EditorSidebar";
import { NewWeddingDialog } from "@/components/dashboard/editor/NewWeddingDialog";
import { PreviewFrame } from "@/components/dashboard/editor/PreviewFrame";
import clsx from "clsx";

interface Props {
  initialConfig: WeddingConfig | null;
  isNew: boolean;
}

interface NewWeddingValues {
  bride: string;
  groom: string;
  date: string;
  notificationEmail?: string | undefined;
}

export function EditorShell({ initialConfig, isNew }: Props) {
  const api = useApi();
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

  const [showDialog, setShowDialog] = useState(isNew);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Prevent body scroll when preview sheet is open
  useEffect(() => {
    document.body.style.overflow = previewOpen ? "hidden" : "";

    // When closing the preview sheet, stop any playing audio/video in the iframe
    // by blanking then restoring the src — cleanest cross-origin safe approach
    if (!previewOpen && previewIframeRef.current) {
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
  }, []);

  const handleNewWeddingConfirm = useCallback((values: NewWeddingValues) => {
    setConfig((prev) => ({
      ...prev,
      bride: values.bride,
      groom: values.groom,
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
      } satisfies Parameters<typeof api.api.weddings.post>[0];

      if (isNew) {
        const { data, error } = await api.api.weddings.post(payload);
        if (error) {
          handleApiError(error, "Failed to create wedding");
          throw error;
        }
        setSaveState("saved");
        toast.success("Wedding created!");
        posthog.capture("wedding_created", {
          slug: data!.slug,
          bride: config.bride,
          groom: config.groom,
          theme_key: config.themeKey,
        });
        // Navigate to the new slug so the URL is correct
        startTransition(() => router.replace(`/app/editor/${data!.slug}`));
      } else {
        const { error } = await api.api
          .weddings({ slug: config.slug })
          .patch(payload);
        if (error) {
          handleApiError(error, "Failed to save wedding");
          throw error;
        }
        setSaveState("saved");
        toast.success("Changes saved");
        posthog.capture("wedding_saved", {
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
        event_name: "wedding_save_failed",
        properties: { is_new: isNew },
      });
      setSaveState("error");
    } finally {
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  return (
    <div className="flex h-full overflow-hidden space-x-2!">
      {showDialog && <NewWeddingDialog onConfirm={handleNewWeddingConfirm} />}

      {/* Left — controls */}
      <div className="flex-1 shrink-0 flex flex-col border-r overflow-hidden border-[#D4AF3718]">
        {/* Editor header */}
        <div className="px-6! py-4! border-b flex items-center justify-between shrink-0 border-[#D4AF3718]">
          <div>
            <p className="font-display italic text-[#F5F0E8] text-xl!">
              {config.bride || "Bride"} & {config.groom || "Groom"}
            </p>
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
        <div className="px-6 py-3 border-b border-dash-border/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-label text-[12px] font-semibold tracking-widest uppercase text-dash-gold">
              Live Preview
            </span>
            {isPending && (
              <span className="font-label text-[12px] font-semibold tracking-widest uppercase text-dash-gold">
                Refreshing…
              </span>
            )}
          </div>
          {/* Close button — mobile sheet only */}
          <button
            onClick={() => setPreviewOpen(false)}
            className="lg:hidden flex items-center justify-center size-7 rounded-lg text-dash-text/40 hover:text-dash-gold transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewFrame config={config} iframeRef={previewIframeRef} />
        </div>
      </div>
    </div>
  );
}
