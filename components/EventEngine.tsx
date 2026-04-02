"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
import { RoomsEngineR3F } from "@/components/rooms-r3f/R3FAdapter";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

import { useTheme } from "@/lib/ThemeContext";
import { buildSections } from "@/lib/eventSections";

import { getHost1Name, getHost2Name } from "@/lib/eventHelpers";
import { DEMO_EVENT_CONFIG, EventConfig } from "@/types/event";

interface EventEngineProps {
  config?: EventConfig;
  showWatermark?: boolean;
  brandName?: string;
  previewLocked?: boolean;
  isEditorPreview?: boolean;
}

gsap.registerPlugin(ScrollTrigger);

export function EventEngine({
  config = DEMO_EVENT_CONFIG,
  showWatermark,
  brandName,
  previewLocked = false,
  isEditorPreview = false,
}: EventEngineProps) {
  const { theme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(config.slug === "demo");

  const host1 = getHost1Name(config);
  const host2 = getHost2Name(config); // undefined for single-host events

  const [isPreview, setIsPreview] = useState(false);
  const [registryItemCount, setRegistryItemCount] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    setIsPreview(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (!config.registryEnabled || !config.slug) return;
    fetch(`/api/registry/public/${config.slug}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: unknown[]) =>
        setRegistryItemCount(Array.isArray(items) ? items.length : 0),
      )
      .catch(() => setRegistryItemCount(0));
  }, [config.registryEnabled, config.slug]);

  const curtainStyle = config.curtainStyle ?? "velvet";
  const entryStyle = config.entryStyle ?? "curtain";
  const navMode = config.navMode ?? "scroll";

  const handleCurtainOpen = () => {
    if (previewLocked) return;
    setCurtainOpen(true);
    // Post to parent (iframe mode) or same window (inline mode)
    const target = window.self !== window.top ? window.parent : window;
    target.postMessage({ type: "CURTAIN_OPEN" }, "*");
  };

  const handleDateRevealed = () => {
    setDateRevealed(true);
    const target = window.self !== window.top ? window.parent : window;
    target.postMessage({ type: "DATE_REVEALED" }, "*");
  };

  const sections = buildSections(
    config,
    dateRevealed,
    handleDateRevealed,
    registryItemCount,
    navMode,
  );

  useEffect(() => {
    if (!curtainOpen) return;

    const container = document.querySelector("[data-scroll-container]");
    if (!container) return;

    // Tell GSAP ScrollTrigger to use our custom scroll container
    ScrollTrigger.defaults({ scroller: container });
    ScrollTrigger.refresh();

    const sectionEls = Array.from(
      container.querySelectorAll<HTMLElement>("[data-section]"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionEls.indexOf(entry.target as HTMLElement);
            if (idx !== -1) {
              setActiveIndex(idx);
              if (window.self !== window.top) {
                window.parent.postMessage(
                  { type: "SECTION_CHANGE", index: idx },
                  "*",
                );
              }
            }
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [curtainOpen, sections.length]);

  const sectionBg = (i: number) => {
    const cycle = i % 3;
    if (cycle === 0) return theme.bg;
    if (cycle === 1) return theme.bgMid;
    return `${theme.curtainDark}40`; // darkest — curtain tint at 40% opacity
  };

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
          host1={host1}
          host2={host2}
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
                position: "relative",
                // background: i % 2 === 0 ? theme.bg : theme.bgMid,
                background: sectionBg(i),
                // Padding to keep content below the drape valance when drape is active
                paddingTop:
                  curtainStyle === "drape" ? "clamp(140px, 24vh, 280px)" : 0,
              }}
            >
              {/* Chapter marker */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                {/* Top gradient bar — thicker, more dramatic */}
                <div
                  style={{
                    width: "100%",
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${theme.gold}90, transparent)`,
                  }}
                />
                {/* Ornament pill */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 20px",
                    background: sectionBg(i),
                    border: `1px solid ${theme.gold}30`,
                    borderTop: "none",
                    borderRadius: "0 0 20px 20px",
                  }}
                >
                  <span style={{ color: `${theme.gold}60`, fontSize: 8 }}>
                    ✦
                  </span>
                  <span
                    style={{
                      color: `${theme.gold}90`,
                      fontFamily: "var(--font-label)",
                      fontSize: "8px",
                      letterSpacing: "0.6em",
                      textTransform: "uppercase",
                    }}
                  >
                    {section.label}
                  </span>
                  <span style={{ color: `${theme.gold}60`, fontSize: 8 }}>
                    ✦
                  </span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 120,
                  background: `linear-gradient(to bottom, ${theme.bg}CC, transparent)`,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
                }}
              />

              {section.node}
            </div>
          ))}
        </main>
      )}

      {navMode === "rooms" && curtainOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
          }}
        >
          <RoomsEngineR3F
            config={config}
            sections={sections}
            dateRevealed={dateRevealed}
            onDateRevealed={handleDateRevealed}
            isEditorPreview={isEditorPreview}
          />
        </div>
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
