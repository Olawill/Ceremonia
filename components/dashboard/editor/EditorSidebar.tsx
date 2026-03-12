"use client";

import clsx from "clsx";
import { useState } from "react";

import type { WeddingConfig } from "@/types/wedding";

import { ContentEditor } from "@/components/dashboard/editor/ContentEditor";
import { DesignPanel } from "@/components/dashboard/editor/DesignPanel";
import { MediaUploader } from "@/components/dashboard/editor/MediaUploader";
import { MenuEditor } from "@/components/dashboard/editor/MenuEditor";
import { RegistryEditor } from "@/components/dashboard/editor/RegistryEditor";
import { RSVPSettings } from "@/components/dashboard/editor/RSVPSettings";
import { TimelineEditor } from "@/components/dashboard/editor/TimelineEditor";
import { VenueEditor } from "@/components/dashboard/editor/VenueEditor";

const TABS = [
  { id: "design", label: "Design" },
  { id: "couple", label: "Couple" },
  { id: "venue", label: "Venue" },
  { id: "timeline", label: "Timeline" },
  { id: "menu", label: "Menu" },
  { id: "media", label: "Media" },
  { id: "dresscode", label: "Attire" },
  { id: "accommodation", label: "Stay" },
  { id: "party", label: "Party" },
  { id: "faq", label: "FAQ" },
  { id: "livestream", label: "Stream" },
  { id: "rsvp", label: "RSVP" },
  { id: "registry", label: "Registry" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function EditorSidebar({ config, onChange, previewIframeRef }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("couple");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-end gap-1 border-b border-[#D4AF3718] overflow-x-auto shrink-0 px-2! pt-2! w-full tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "shrink-0 pb-2! px-1! font-label text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-200 border-b-2 cursor-pointer",
              activeTab === tab.id
                ? "text-[#D4AF37] border-b-[#D4AF37]"
                : "text-[#D4AF3780] border-b-transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {/* Tab content — all panels stay mounted to preserve state and avoid re-fetching */}
      <div className="flex-1 overflow-y-auto p-2! space-y-6!">
        <div className={activeTab === "design" ? "p-2 space-y-6" : "hidden"}>
          <DesignPanel
            config={config}
            onChange={onChange}
            previewIframeRef={previewIframeRef}
          />
        </div>
        <div className={activeTab === "couple" ? "p-2 space-y-6" : "hidden"}>
          <ContentEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "venue" ? "p-2 space-y-6" : "hidden"}>
          <VenueEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "timeline" ? "p-2 space-y-6" : "hidden"}>
          <TimelineEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "menu" ? "p-2 space-y-6" : "hidden"}>
          <MenuEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "media" ? "p-2 space-y-6" : "hidden"}>
          <MediaUploader config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "rsvp" ? "p-2 space-y-6" : "hidden"}>
          <RSVPSettings config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "registry" ? "p-2 space-y-6" : "hidden"}>
          <RegistryEditor config={config} />
        </div>
      </div>
    </div>
  );
}
