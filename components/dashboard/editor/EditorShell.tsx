"use client";

import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

import { useApi } from "@/hooks/useApi";

import type { WeddingConfig } from "@/types/wedding";
import { DEMO_WEDDING_CONFIG } from "@/types/wedding";

import { EditorSidebar } from "@/components/dashboard/editor/EditorSidebar";
import { NewWeddingDialog } from "@/components/dashboard/editor/NewWeddingDialog";
import { PreviewFrame } from "@/components/dashboard/editor/PreviewFrame";
import {
  AlertCircleIcon,
  CheckIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";

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
        if (error) throw new Error("Save failed");
        setSaveState("saved");
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
        if (error) throw new Error("Save failed");
        setSaveState("saved");
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
      posthog.captureException(err, { event_name: "wedding_save_failed", properties: { is_new: isNew } });
      setSaveState("error");
    } finally {
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {showDialog && <NewWeddingDialog onConfirm={handleNewWeddingConfirm} />}

      {/* Left — controls */}
      <div className="w-[420px] shrink-0 flex flex-col border-r overflow-hidden border-[#D4AF3718]">
        {/* Editor header */}
        <div className="px-6! py-4! border-b flex items-center justify-between shrink-0 border-[#D4AF3718]">
          <div>
            <p className="font-display italic text-[#F5F0E8] text-xl!">
              {config.bride || "Bride"} & {config.groom || "Groom"}
            </p>
            {!isNew && (
              <p
                className="font-label text-[10px] tracking-widest"
                style={{ color: "#D4AF3760" }}
              >
                {config.slug}.ceremonia.app
              </p>
            )}
          </div>
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

      {/* Right — preview */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "#050505" }}
      >
        <div
          className="px-6 py-3 border-b flex items-center gap-3 shrink-0"
          style={{ borderColor: "#D4AF3718" }}
        >
          <span
            className="font-label text-[12px] font-semibold tracking-widest uppercase"
            style={{ color: "#D4AF37" }}
          >
            Live Preview
          </span>
          {isPending && (
            <span
              className="font-label text-[12px] font-semibold tracking-widest uppercase"
              style={{ color: "#D4AF37" }}
            >
              Refreshing…
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewFrame config={config} iframeRef={previewIframeRef} />
        </div>
      </div>
    </div>
  );
}
