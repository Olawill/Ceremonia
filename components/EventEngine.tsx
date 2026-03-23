"use client";

import { useEffect, useState } from "react";

import { CascadeCurtain } from "@/components/curtain/CascadeCurtain";
import { DrapedCurtain } from "@/components/curtain/DrapedCurtain";
import { IrisCurtain } from "@/components/curtain/IrisCurtain";
import { SheerCurtain } from "@/components/curtain/SheerCurtain";
import { SplitCurtain } from "@/components/curtain/SplitCurtain";
import { VeilCurtain } from "@/components/curtain/VeilCurtain";
import { VelvetCurtain } from "@/components/curtain/VelvetCurtain";
import { EnvelopeCurtain } from "@/components/entry/EnvelopeCurtain";

import { DrapeFrame } from "@/components/effects/DrapeFrame";
import { DustParticles } from "@/components/effects/DustParticles";
import { RoomsEngine } from "@/components/rooms/RoomsEngine";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

import { useTheme } from "@/lib/ThemeContext";
import { buildSections } from "@/lib/eventSections";

import { DEMO_EVENT_CONFIG, EventConfig } from "@/types/event";

interface EventEngineProps {
  config?: EventConfig;
  showWatermark?: boolean;
  brandName?: string;
}

export function EventEngine({
  config = DEMO_EVENT_CONFIG,
  showWatermark,
  brandName,
}: EventEngineProps) {
  const { theme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);

  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    setIsPreview(window.self !== window.top);
  }, []);

  const curtainStyle = config.curtainStyle ?? "velvet";
  const entryStyle = config.entryStyle ?? "curtain";
  const navMode = config.navMode ?? "scroll";

  const handleCurtainOpen = () => {
    setCurtainOpen(true);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "CURTAIN_OPEN" }, "*");
    }
  };

  const handleDateRevealed = () => {
    setDateRevealed(true);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "DATE_REVEALED" }, "*");
    }
  };

  const sections = buildSections(config, dateRevealed, handleDateRevealed);

  useEffect(() => {
    if (!curtainOpen) return;

    const container = document.querySelector("[data-scroll-container]");
    if (!container) return;

    const sectionEls = Array.from(
      container.querySelectorAll<HTMLElement>("[data-section]"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionEls.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [curtainOpen, sections.length]);

  return (
    <>
      {/* Always-visible overlays */}
      <DustParticles />
      {showWatermark && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <p className="font-label text-[10px] tracking-[0.4em] uppercase px-4 py-2 rounded-full bg-black/60 text-[#D4AF3760] backdrop-blur-sm">
            Made with {brandName ?? "Ceremonia"}
          </p>
        </div>
      )}
      <AudioPlayer
        autoPlay={curtainOpen}
        src={config.audioUrl ?? "/audio/royal.mp3"}
      />
      {/* Drape frame – fixed peek-through frame shown on every page when drape style active */}
      {entryStyle === "curtain" && curtainStyle === "drape" && <DrapeFrame />}

      {/* ── Entry experience ──
    Both are always mounted. CSS visibility+opacity switching (not conditional
    rendering) prevents the 1-frame flash when entryStyle changes in the editor. ── */}
      <div style={{ display: entryStyle === "curtain" ? "block" : "none" }}>
        {curtainStyle === "velvet" && (
          <VelvetCurtain onOpen={handleCurtainOpen} />
        )}
        {curtainStyle === "drape" && (
          <DrapedCurtain onOpen={handleCurtainOpen} />
        )}
        {curtainStyle === "sheer" && (
          <SheerCurtain onOpen={handleCurtainOpen} />
        )}
        {curtainStyle === "cascade" && (
          <CascadeCurtain
            onOpen={handleCurtainOpen}
            panelCount={config.customTheme?.panelCount ?? 5}
          />
        )}
        {curtainStyle === "iris" && (
          <IrisCurtain
            onOpen={handleCurtainOpen}
            bladeCount={config.customTheme?.bladeCount ?? 8}
          />
        )}
        {curtainStyle === "split" && (
          <SplitCurtain onOpen={handleCurtainOpen} />
        )}
        {curtainStyle === "veil" && <VeilCurtain onOpen={handleCurtainOpen} />}
      </div>

      <div style={{ display: entryStyle === "envelope" ? "block" : "none" }}>
        <EnvelopeCurtain
          onOpen={handleCurtainOpen}
          host1={config.bride}
          host2={config.groom || undefined}
          eventType={config.eventType}
        />
      </div>

      {/* ── Content navigation ── */}
      {navMode === "scroll" && curtainOpen && (
        // Scrollable Main content – revealed after curtain opens
        <main
          data-scroll-container
          className="relative overflow-x-hidden"
          style={{
            // background: theme.bg,
            color: theme.text,
            height: "100vh",
            overflowY: curtainOpen ? "scroll" : "hidden",
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
            visibility: curtainOpen ? "visible" : "hidden",
            opacity: curtainOpen ? 1 : 0,
            pointerEvents: curtainOpen ? "auto" : "none",
          }}
        >
          {/* Each section wrapper enforces full-viewport snap alignment */}
          {sections.map((section, i) => (
            <div
              key={i}
              data-section={section.key}
              style={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                minHeight: "100vh",
                background: i % 2 === 0 ? theme.bg : theme.bgMid,
                // Padding to keep content below the drape valance when drape is active
                paddingTop:
                  curtainStyle === "drape" ? "clamp(140px, 24vh, 280px)" : 0,
              }}
            >
              {section.node}
            </div>
          ))}
        </main>
      )}

      {navMode === "rooms" && curtainOpen && (
        <RoomsEngine config={config} sections={sections} />
      )}

      {/* Float nav */}
      {isPreview && navMode === "scroll" && (
        <div
          style={{
            position: "fixed",
            display: curtainOpen ? "flex" : "none",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9999,
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {sections.map((s, i) => (
            <button
              key={s.key}
              title={s.label}
              onClick={() =>
                window.postMessage({ type: "SCROLL_TO", index: i }, "*")
              }
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                border: "1px solid " + theme.gold + "80",
                // background: theme.gold + "40",
                background: i === activeIndex ? theme.gold : theme.gold + "40",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = theme.gold;
                btn.style.transform = "scale(1.5)";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                // btn.style.background = `${theme.gold}40`;
                btn.style.background =
                  i === activeIndex ? theme.gold : `${theme.gold}40`;
                btn.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
