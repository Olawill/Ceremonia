"use client";

import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";

import type { EventConfig } from "@/types/event";
import { EventType, getVocabulary } from "@/types/event";

import { AccommodationEditor } from "@/components/dashboard/editor/AccommodationEditor";
import { ContentEditor } from "@/components/dashboard/editor/ContentEditor";
import { DesignPanel } from "@/components/dashboard/editor/DesignPanel";
import { DressCodeEditor } from "@/components/dashboard/editor/DressCodeEditor";
import { EventPartyEditor } from "@/components/dashboard/editor/EventPartyEditor";
import { FaqEditor } from "@/components/dashboard/editor/FaqEditor";
import { LivestreamEditor } from "@/components/dashboard/editor/LivestreamEditor";
import { MediaUploader } from "@/components/dashboard/editor/MediaUploader";
import { MenuEditor } from "@/components/dashboard/editor/MenuEditor";
import { PhotoGalleryEditor } from "@/components/dashboard/editor/PhotoGalleryEditor";
import { RegistryEditor } from "@/components/dashboard/editor/RegistryEditor";
import { RSVPSettings } from "@/components/dashboard/editor/RSVPSettings";
import { TimelineEditor } from "@/components/dashboard/editor/TimelineEditor";
import { TravelGuideEditor } from "@/components/dashboard/editor/TravelGuideEditor";
import { VenueEditor } from "@/components/dashboard/editor/VenueEditor";

function getCoupleTabLabel(vocab: ReturnType<typeof getVocabulary>): string {
  // Single-host events: just use the host label
  if (!vocab.dualHost) return vocab.host1Label;

  // Dual-host: pick a short contextual label based on event type
  const h1 = vocab.host1Label;
  const h2 = vocab.host2Label ?? "";

  if (h1 === "Bride" && h2 === "Groom") return "Couple";
  if (h1 === "Partner" && h2 === "Partner") return "Partners";
  if (h1 === "Mum-to-be" || h2 === "Mum-to-be") return "Parents";
  if (h1 === "Parent" && h2 === "Parent") return "Parents";
  if (h1 === "Host" && h2 === "Co-host") return "Hosts";

  // Fallback: first word of host1Label & first word of host2Label
  return `${h1.split(" ")[0]} & ${h2.split(" ")[0]}`;
}

function getTabs(eventType: EventType) {
  const vocab = getVocabulary(eventType);

  const TABS = [
    { id: "design", label: "Design" },
    { id: "host", label: getCoupleTabLabel(vocab) },
    { id: "venue", label: "Venue" },
    { id: "timeline", label: "Timeline" },
    { id: "menu", label: vocab.menuLabel.split(" ")[0] },
    { id: "media", label: "Media" },
    { id: "gallery", label: "Gallery" },
    { id: "dresscode", label: vocab.attireLabel },
    { id: "accommodation", label: "Stay" },
    { id: "party", label: vocab.partyLabel.split(" ")[0] },
    { id: "faq", label: "FAQ" },
    { id: "livestream", label: "Stream" },
    { id: "travel", label: "Travel" },
    { id: "rsvp", label: "RSVP" },
    { id: "registry", label: "Registry" },
  ] as const;

  return TABS;
}

type TabId = ReturnType<typeof getTabs>[number]["id"];

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function EditorSidebar({ config, onChange, previewIframeRef }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const TABS = getTabs(config.eventType);

  const activeTab = (searchParams.get("tab") as TabId | null) ?? TABS[1].id;

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === TABS[1].id) {
      params.delete("tab"); // default tab — keep URL clean
    } else {
      params.set("tab", tab);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
        <div className={activeTab === "host" ? "p-2 space-y-6" : "hidden"}>
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
        <div className={activeTab === "gallery" ? "p-2 space-y-6" : "hidden"}>
          <PhotoGalleryEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "dresscode" ? "p-2 space-y-6" : "hidden"}>
          <DressCodeEditor config={config} onChange={onChange} />
        </div>
        <div
          className={activeTab === "accommodation" ? "p-2 space-y-6" : "hidden"}
        >
          <AccommodationEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "party" ? "p-2 space-y-6" : "hidden"}>
          <EventPartyEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "faq" ? "p-2 space-y-6" : "hidden"}>
          <FaqEditor config={config} onChange={onChange} />
        </div>
        <div
          className={activeTab === "livestream" ? "p-2 space-y-6" : "hidden"}
        >
          <LivestreamEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "travel" ? "p-2 space-y-6" : "hidden"}>
          <TravelGuideEditor config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "rsvp" ? "p-2 space-y-6" : "hidden"}>
          <RSVPSettings config={config} onChange={onChange} />
        </div>
        <div className={activeTab === "registry" ? "p-2 space-y-6" : "hidden"}>
          <RegistryEditor config={config} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
