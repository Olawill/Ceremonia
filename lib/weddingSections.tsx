import { Accommodation } from "@/components/sections/Accommodation";
import { Countdown } from "@/components/sections/Countdown";
import { DressCode } from "@/components/sections/DressCode";
import { FAQ } from "@/components/sections/FAQ";
import { Finale } from "@/components/sections/Finale";
import { GuestBook } from "@/components/sections/GuestBook";
import { Livestream } from "@/components/sections/Livestream";
import { ParallaxHero } from "@/components/sections/ParallaxHero";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { RSVP } from "@/components/sections/RSVP";
import { Registry } from "@/components/sections/Registry";
import { ScratchDate } from "@/components/sections/ScratchDate";
import { Timeline } from "@/components/sections/Timeline";
import { TravelGuide } from "@/components/sections/TravelGuide";
import { VenueDetails } from "@/components/sections/VenueDetails";
import { WeddingMenu } from "@/components/sections/WeddingMenu";
import { WeddingParty } from "@/components/sections/WeddingParty";
import { getVocabulary } from "@/types/event";

import {
  DEMO_WEDDING_CONFIG,
  FALLBACK_LOCATION,
  type VenueEvent,
  type WeddingConfig,
} from "@/types/wedding";
import { getHost1Name, getHost2Name } from "./eventHelpers";

export interface WeddingSection {
  key: string;
  label: string;
  node: React.ReactElement;
}

export function buildSections(
  config: WeddingConfig,
  dateRevealed: boolean,
  onDateRevealed: () => void,
): WeddingSection[] {
  const vocab = getVocabulary(config.eventType);
  const host1 = getHost1Name(config);
  const host2 = getHost2Name(config);

  const location: VenueEvent =
    config.venueDetails.find((d) => d.label === "Location") ??
    DEMO_WEDDING_CONFIG.venueDetails.find((d) => d.label === "Location") ??
    FALLBACK_LOCATION;

  const always: WeddingSection[] = [
    {
      key: "hero",
      label: "Opening",
      node: (
        <ParallaxHero
          key="hero"
          bride={host1}
          groom={host2}
          tagLine={config.tagLine}
          heroPhotoUrl={config.heroPhotoUrl}
          topLabel={vocab.topLabel}
        />
      ),
    },
    {
      key: "scratch",
      label: "Date Reveal",
      node: (
        <ScratchDate
          key="scratch"
          date={config.date}
          onRevealed={onDateRevealed}
          // revealLabel="" // TODO
        />
      ),
    },
  ];

  if (!dateRevealed) return always;

  const revealed: WeddingSection[] = [
    {
      key: "countdown",
      label: "Countdown",
      node: (
        <Countdown
          key="countdown"
          date={config.date}
          location={location}
          eventLabel={vocab.eventLabel}
        />
      ),
    },
    {
      key: "timeline",
      label: "Timeline",
      node: <Timeline key="timeline" events={config.timeline} />,
    },
    ...(config.photoGalleryEnabled && config.galleryPhotos?.length
      ? [
          {
            key: "gallery",
            label: "Gallery",
            node: <PhotoGallery key="gallery" photos={config.galleryPhotos} />,
          },
        ]
      : []),
    {
      key: "venue",
      label: "Venue",
      node: <VenueDetails key="venue" details={config.venueDetails} />,
    },
    ...(config.dressCodeEnabled && config.dressCode
      ? [
          {
            key: "dresscode",
            label: "Dress Code",
            node: <DressCode key="dresscode" dressCode={config.dressCode} />,
          },
        ]
      : []),
    ...(config.accommodationEnabled && config.accommodation?.options.length
      ? [
          {
            key: "accommodation",
            label: "Accommodation",
            node: (
              <Accommodation
                key="accommodation"
                accommodation={config.accommodation}
              />
            ),
          },
        ]
      : []),
    ...(config.weddingPartyEnabled && config.weddingParty?.length
      ? [
          {
            key: "weddingparty",
            label: "Wedding Party",
            node: (
              <WeddingParty
                key="weddingparty"
                members={config.weddingParty}
                bride={host1}
                groom={host2}
                sectionLabel={vocab.partyLabel}
              />
            ),
          },
        ]
      : []),
    ...(config.faqEnabled && config.faq?.length
      ? [
          {
            key: "faq",
            label: "FAQ",
            node: <FAQ key="faq" items={config.faq} />,
          },
        ]
      : []),
    ...(config.livestreamEnabled && config.livestreamUrl
      ? [
          {
            key: "livestream",
            label: "Livestream",
            node: (
              <Livestream
                key="livestream"
                url={config.livestreamUrl}
                title={config.livestreamTitle}
                note={config.livestreamNote}
                date={config.date}
              />
            ),
          },
        ]
      : []),
    ...(config.travelGuideEnabled && config.travelItems?.length
      ? [
          {
            key: "travel",
            label: "Travel",
            node: (
              <TravelGuide
                key="travel"
                items={config.travelItems}
                city={location.value ?? ""}
              />
            ),
          },
        ]
      : []),
    {
      key: "menu",
      label: "Menu",
      node: (
        <WeddingMenu
          key="menu"
          courses={config.menuCourses}
          label={vocab.menuLabel}
          subLabel={vocab.menuSubLabel}
          description={vocab.menuDescription}
        />
      ),
    },
    {
      key: "rsvp",
      label: "RSVP",
      node: (
        <RSVP
          key="rsvp"
          weddingId={config.id}
          enabled={config.rsvpEnabled}
          rsvpDeadline={config.rsvpDeadline}
        />
      ),
    },
    ...(config.registryEnabled
      ? [
          {
            key: "registry",
            label: "Registry",
            node: (
              <Registry
                key="registry"
                weddingSlug={config.slug}
                label={vocab.registryLabel}
              />
            ),
          },
        ]
      : []),
    ...(config.guestBookEnabled
      ? [
          {
            key: "guestbook",
            label: "Guestbook",
            node: (
              <GuestBook
                key="guestbook"
                weddingId={config.id ?? ""}
                enabled={config.guestBookEnabled!}
              />
            ),
          },
        ]
      : []),
    {
      key: "finale",
      label: "Finale",
      node: (
        <Finale
          key="finale"
          bride={host1}
          groom={host2}
          finaleTagLine={config.finaleTagLine}
          finaleHeading={vocab.finaleHeading}
          date={config.date}
          showCoupleIllustration={
            config.eventType === "wedding" || config.eventType === "engagement"
          }
        />
      ),
    },
  ];

  return [...always, ...revealed];
}
