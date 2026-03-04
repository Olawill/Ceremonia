"use client";

import { useState } from "react";

import type { WeddingConfig } from "@/types/wedding";

import { ContentEditor } from "@/components/dashboard/editor/ContentEditor";
import { DesignPanel } from "@/components/dashboard/editor/DesignPanel";
import { MenuEditor } from "@/components/dashboard/editor/MenuEditor";
import { RSVPSettings } from "@/components/dashboard/editor/RSVPSettings";
import { TimelineEditor } from "@/components/dashboard/editor/TimelineEditor";
import { VenueEditor } from "@/components/dashboard/editor/VenueEditor";
import clsx from "clsx";
import { MediaUploader } from "./MediaUploader";
import { RegistryEditor } from "./RegistryEditor";

const TABS = [
  { id: "design", label: "Design" },
  { id: "couple", label: "Couple" },
  { id: "venue", label: "Venue" },
  { id: "timeline", label: "Timeline" },
  { id: "menu", label: "Menu" },
  { id: "media", label: "Media" },
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
      <div className="flex flex-wrap gap-2 overflow-x-auto border-b shrink-0 text-[#D4AF3718]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex-1 py-3.5! font-label text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-200 border-b-2",
              activeTab === tab.id
                ? "text-[#D4AF37] border-b-[#D4AF37]"
                : "text-[#D4AF3780] transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-2! space-y-6!">
        {activeTab === "design" && (
          <DesignPanel
            config={config}
            onChange={onChange}
            previewIframeRef={previewIframeRef}
          />
        )}
        {activeTab === "couple" && (
          <ContentEditor config={config} onChange={onChange} />
        )}
        {activeTab === "venue" && (
          <VenueEditor config={config} onChange={onChange} />
        )}
        {activeTab === "timeline" && (
          <TimelineEditor config={config} onChange={onChange} />
        )}
        {activeTab === "menu" && (
          <MenuEditor config={config} onChange={onChange} />
        )}
        {activeTab === "media" && (
          <MediaUploader config={config} onChange={onChange} />
        )}
        {activeTab === "rsvp" && (
          <RSVPSettings config={config} onChange={onChange} />
        )}
        {activeTab === "registry" && <RegistryEditor config={config} />}
      </div>
    </div>
  );
}
