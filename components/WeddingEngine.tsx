"use client";

import { useState } from "react";

import { DrapedCurtain } from "@/components/curtain/DrapedCurtain";
import { VelvetCurtain } from "@/components/curtain/VelvetCurtain";
import { DustParticles } from "@/components/effects/DustParticles";
import { Countdown } from "@/components/sections/Countdown";
import { Finale } from "@/components/sections/Finale";
import { ParallaxHero } from "@/components/sections/ParallaxHero";
import { RSVP } from "@/components/sections/RSVP";
import { ScratchDate } from "@/components/sections/ScratchDate";
import { Timeline } from "@/components/sections/Timeline";
import { VenueDetails } from "@/components/sections/VenueDetails";
import { WeddingMenu } from "@/components/sections/WeddingMenu";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

import { useTheme } from "@/lib/ThemeContext";
import { DrapeFrame } from "./effects/DrapeFrame";

export function WeddingEngine() {
  const { theme } = useTheme();
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);

  const [curtainStyle, setCurtainStyle] = useState<"velvet" | "drape">(
    "velvet",
  );

  const handleCurtainOpen = () => setCurtainOpen(true);

  return (
    <>
      {/* Always-visible overlays */}
      <DustParticles />
      <ThemeSelector
        curtainStyle={curtainStyle}
        onCurtainChange={setCurtainStyle}
      />
      <AudioPlayer autoPlay={curtainOpen} />

      {/* Drape frame – fixed peek-through frame shown on every page when drape style active */}
      {curtainOpen && curtainStyle === "drape" && <DrapeFrame />}

      {/* Curtain – removed from DOM once open */}
      {curtainStyle === "velvet" ? (
        <VelvetCurtain onOpen={handleCurtainOpen} />
      ) : (
        <DrapedCurtain onOpen={handleCurtainOpen} />
      )}

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
            <ParallaxHero key="hero" />,

            // ScratchDate locks scroll until revealed
            <ScratchDate
              key="scratch"
              onRevealed={() => setDateRevealed(true)}
            />,

            // These sections only mount after the date is revealed
            ...(dateRevealed
              ? [
                  <Countdown key="countdown" />,
                  <Timeline key="timeline" />,
                  <VenueDetails key="venue" />,
                  <WeddingMenu key="menu" />,
                  <RSVP key="rsvp" />,
                  <Finale key="finale" />,
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

        // <>
        //   <ParallaxHero />

        //   {/* ScratchDate locks scroll until revealed */}
        //   <ScratchDate onRevealed={() => setDateRevealed(true)} />

        //   {/* These sections only mount after the date is revealed */}
        //   {dateRevealed && (
        //     <>
        //       <Countdown />
        //       <Timeline />
        //       <VenueDetails />
        //       <WeddingMenu />
        //       <RSVP />
        //       <Finale />
        //     </>
        //   )}
        // </>
      )}
    </>
  );
}
