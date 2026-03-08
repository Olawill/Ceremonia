"use client";

import { useState } from "react";

import { CascadeCurtain } from "@/components/curtain/CascadeCurtain";
import { DrapedCurtain } from "@/components/curtain/DrapedCurtain";
import { IrisCurtain } from "@/components/curtain/IrisCurtain";
import { SheerCurtain } from "@/components/curtain/SheerCurtain";
import { SplitCurtain } from "@/components/curtain/SplitCurtain";
import { VeilCurtain } from "@/components/curtain/VeilCurtain";
import { VelvetCurtain } from "@/components/curtain/VelvetCurtain";

import { DrapeFrame } from "@/components/effects/DrapeFrame";
import { DustParticles } from "@/components/effects/DustParticles";

import { Countdown } from "@/components/sections/Countdown";
import { DressCode } from "@/components/sections/DressCode";
import { Finale } from "@/components/sections/Finale";
import { GuestBook } from "@/components/sections/GuestBook";
import { ParallaxHero } from "@/components/sections/ParallaxHero";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { RSVP } from "@/components/sections/RSVP";
import { Registry } from "@/components/sections/Registry";
import { ScratchDate } from "@/components/sections/ScratchDate";
import { Timeline } from "@/components/sections/Timeline";
import { TravelGuide } from "@/components/sections/TravelGuide";
import { VenueDetails } from "@/components/sections/VenueDetails";
import { WeddingMenu } from "@/components/sections/WeddingMenu";

import { AudioPlayer } from "@/components/ui/AudioPlayer";

import { useTheme } from "@/lib/ThemeContext";

import {
  CurtainStyle,
  DEMO_WEDDING_CONFIG,
  FALLBACK_LOCATION,
  VenueEvent,
  WeddingConfig,
} from "@/types/wedding";

interface WeddingEngineProps {
  config?: WeddingConfig;
  showWatermark?: boolean;
  brandName?: string;
}

export function WeddingEngine({
  config = DEMO_WEDDING_CONFIG,
  showWatermark,
  brandName,
}: WeddingEngineProps) {
  const { theme } = useTheme();

  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);

  const [curtainStyle, setCurtainStyle] = useState<CurtainStyle>(
    config.curtainStyle ?? "velvet",
  );

  const handleCurtainOpen = () => setCurtainOpen(true);

  const location: VenueEvent =
    config.venueDetails.find((d) => d.label === "Location") ??
    DEMO_WEDDING_CONFIG.venueDetails.find((d) => d.label === "Location") ??
    FALLBACK_LOCATION;

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
      {curtainOpen && curtainStyle === "drape" && <DrapeFrame />}

      {/* Curtain – removed from DOM once open */}
      {curtainStyle === "velvet" && (
        <VelvetCurtain onOpen={handleCurtainOpen} />
      )}
      {curtainStyle === "drape" && <DrapedCurtain onOpen={handleCurtainOpen} />}
      {curtainStyle === "sheer" && <SheerCurtain onOpen={handleCurtainOpen} />}
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
      {curtainStyle === "split" && <SplitCurtain onOpen={handleCurtainOpen} />}
      {curtainStyle === "veil" && <VeilCurtain onOpen={handleCurtainOpen} />}

      {/* Scrollable Main content – revealed after curtain opens */}
      {curtainOpen && (
        /*
         * scroll-snap-type: y mandatory
         * Each section is a snap point so you can't see the section
         * above or below – the viewport snaps cleanly between them.
         */
        <main
          data-scroll-container
          className="relative overflow-x-hidden"
          style={{
            background: theme.bg,
            color: theme.text,
            // Scroll snap container
            height: "100vh",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
          }}
        >
          {/* Each section wrapper enforces full-viewport snap alignment */}
          {[
            <ParallaxHero
              key="hero"
              bride={config.bride}
              groom={config.groom}
              tagLine={config.tagLine}
              heroPhotoUrl={config.heroPhotoUrl}
            />,

            // ScratchDate locks scroll until revealed
            <ScratchDate
              key="scratch"
              date={config.date}
              onRevealed={() => setDateRevealed(true)}
            />,

            // These sections only mount after the date is revealed
            ...(dateRevealed
              ? [
                  <Countdown
                    key="countdown"
                    date={config.date}
                    location={location}
                  />,
                  <Timeline key="timeline" events={config.timeline} />,
                  ...(config.photoGalleryEnabled && config.galleryPhotos?.length
                    ? [
                        <PhotoGallery
                          key="gallery"
                          photos={config.galleryPhotos}
                        />,
                      ]
                    : []),

                  <VenueDetails key="venue" details={config.venueDetails} />,

                  ...(config.dressCodeEnabled && config.dressCode
                    ? [
                        <DressCode
                          key="dresscode"
                          dressCode={config.dressCode}
                        />,
                      ]
                    : []),

                  ...(config.travelGuideEnabled && config.travelItems?.length
                    ? [
                        <TravelGuide
                          key="travel"
                          items={config.travelItems}
                          city={location.value ?? ""}
                        />,
                      ]
                    : []),

                  <WeddingMenu key="menu" courses={config.menuCourses} />,
                  <RSVP
                    key="rsvp"
                    weddingId={config.id}
                    enabled={config.rsvpEnabled}
                    rsvpDeadline={config.rsvpDeadline}
                  />,
                  ...(config.registryEnabled
                    ? [<Registry key="registry" weddingSlug={config.slug} />]
                    : []),

                  ...(config.guestBookEnabled
                    ? [
                        <GuestBook
                          key="guestbook"
                          weddingId={config.id ?? ""}
                          enabled={config.guestBookEnabled}
                        />,
                      ]
                    : []),

                  <Finale
                    key="finale"
                    bride={config.bride}
                    groom={config.groom}
                    finaleTagLine={config.finaleTagLine}
                    date={config.date}
                  />,
                ]
              : []),
          ].map((section, i) => (
            <div
              key={i}
              style={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                minHeight: "100vh",
                // Padding to keep content below the drape valance when drape is active
                paddingTop:
                  curtainStyle === "drape" ? "clamp(140px, 24vh, 280px)" : 0,
              }}
            >
              {section}
            </div>
          ))}
        </main>
      )}
    </>
  );
}
