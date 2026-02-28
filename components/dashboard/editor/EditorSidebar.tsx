"use client";

import { useState } from "react";

import type { WeddingConfig } from "@/types/wedding";

import { ContentEditor } from "@/components/dashboard/editor/ContentEditor";
import { DesignPanel } from "@/components/dashboard/editor/DesignPanel";
import { MenuEditor } from "@/components/dashboard/editor/MenuEditor";
import { RSVPSettings } from "@/components/dashboard/editor/RSVPSettings";
import { TimelineEditor } from "@/components/dashboard/editor/TimelineEditor";
import { VenueEditor } from "@/components/dashboard/editor/VenueEditor";

const TABS = [
  { id: "design", label: "Design" },
  { id: "couple", label: "Couple" },
  { id: "venue", label: "Venue" },
  { id: "timeline", label: "Timeline" },
  { id: "menu", label: "Menu" },
  { id: "rsvp", label: "RSVP" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

export function EditorSidebar({ config, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("couple");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: "#D4AF3718" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3.5 font-label text-[10px] tracking-[0.3em] uppercase
                      transition-all duration-200 border-b-2"
            style={{
              color: activeTab === tab.id ? "#D4AF37" : "#D4AF3750",
              borderBottomColor:
                activeTab === tab.id ? "#D4AF37" : "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "design" && (
          <DesignPanel config={config} onChange={onChange} />
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
        {activeTab === "rsvp" && (
          <RSVPSettings config={config} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
