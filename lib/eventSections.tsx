import { Accommodation } from "@/components/sections/Accommodation";
import { Countdown } from "@/components/sections/Countdown";
import { DressCode } from "@/components/sections/DressCode";
import { EventMenu } from "@/components/sections/EventMenu";
import { EventParty } from "@/components/sections/EventParty";
import { FAQ } from "@/components/sections/FAQ";
import { Finale } from "@/components/sections/Finale";
import { GuestBook } from "@/components/sections/GuestBook";
import { Livestream } from "@/components/sections/Livestream";
import { ParallaxHero } from "@/components/sections/ParallaxHero";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { Registry } from "@/components/sections/Registry";
import { RSVP } from "@/components/sections/RSVP";
import { ScratchDate } from "@/components/sections/ScratchDate";
import { Timeline } from "@/components/sections/Timeline";
import { TravelGuide } from "@/components/sections/TravelGuide";
import { VenueDetails } from "@/components/sections/VenueDetails";

import { AccommodationPanel } from "@/components/rooms/panels/AccommodationPanel";
import { CountdownPanel } from "@/components/rooms/panels/CountdownPanel";
import { DressCodePanel } from "@/components/rooms/panels/DressCodePanel";
import { EventMenuPanel } from "@/components/rooms/panels/EventMenuPanel";
import { EventPartyPanel } from "@/components/rooms/panels/EventPartyPanel";
import { FAQPanel } from "@/components/rooms/panels/FAQPanel";
import { FinalePanel } from "@/components/rooms/panels/FinalePanel";
import { GuestBookPanel } from "@/components/rooms/panels/GuestBookPanel";
import { LivestreamPanel } from "@/components/rooms/panels/LivestreamPanel";
import { ParallaxHeroPanel } from "@/components/rooms/panels/ParallaxHeroPanel";
import { PhotoGalleryPanel } from "@/components/rooms/panels/PhotoGalleryPanel";
import { RegistryPanel } from "@/components/rooms/panels/RegistryPanel";
import { RSVPPanel } from "@/components/rooms/panels/RSVPPanel";
import { ScratchDatePanel } from "@/components/rooms/panels/ScratchDatePanel";
import { TimelinePanel } from "@/components/rooms/panels/TimelinePanel";
import { TravelGuidePanel } from "@/components/rooms/panels/TravelGuidePanel";
import { VenueDetailsPanel } from "@/components/rooms/panels/VenuDetailsPanel";

import {
  DEMO_EVENT_CONFIG,
  FALLBACK_LOCATION,
  getVocabulary,
  type EventConfig,
  type VenueEvent,
} from "@/types/event";

import { getHost1Name, getHost2Name } from "@/lib/eventHelpers";

export interface EventSection {
  key: string;
  label: string;
  node: React.ReactElement;
}

export function buildSections(
  config: EventConfig,
  dateRevealed: boolean,
  onDateRevealed: () => void,
  registryItemCount?: number,
  navMode?: string,
): EventSection[] {
  const isRooms = navMode === "rooms";

  const vocab = getVocabulary(config.eventType);
  const host1 = getHost1Name(config);
  const host2 = getHost2Name(config);

  const location: VenueEvent =
    config.venueDetails.find((d) => d.label === "Location") ??
    DEMO_EVENT_CONFIG.venueDetails.find((d) => d.label === "Location") ??
    FALLBACK_LOCATION;

  const always: EventSection[] = [
    {
      key: "hero",
      label: "Opening",
      node: isRooms ? (
        <ParallaxHeroPanel
          key="hero"
          bride={host1}
          groom={host2}
          tagLine={config.tagLine}
          heroPhotoUrl={config.heroPhotoUrl}
          topLabel={vocab.topLabel}
          eventType={config.eventType}
          roomsNavPrompt={vocab.roomsNavPrompt}
        />
      ) : (
        <ParallaxHero
          key="hero"
          bride={host1}
          groom={host2}
          tagLine={config.tagLine}
          heroPhotoUrl={config.heroPhotoUrl}
          topLabel={vocab.topLabel}
          eventType={config.eventType}
          isRooms={false}
        />
      ),
    },
    {
      key: "scratch",
      label: "Date Reveal",
      node: isRooms ? (
        <ScratchDatePanel
          key="scratch"
          date={config.date}
          onRevealed={onDateRevealed}
          eventType={config.eventType}
        />
      ) : (
        <ScratchDate
          key="scratch"
          date={config.date}
          onRevealed={onDateRevealed}
          // revealLabel="" // TODO
          eventType={config.eventType}
          isRooms={false}
        />
      ),
    },
  ];

  if (!dateRevealed && !isRooms) return always;

  const revealed: EventSection[] = [
    {
      key: "countdown",
      label: "Countdown",
      node: isRooms ? (
        <CountdownPanel
          key="countdown"
          date={config.date}
          location={location}
          eventLabel={vocab.eventLabel}
        />
      ) : (
        <Countdown
          key="countdown"
          date={config.date}
          location={location}
          eventLabel={vocab.eventLabel}
        />
      ),
    },
    ...(config.timelineEnabled && config.timeline?.length
      ? [
          {
            key: "timeline",
            label: "Timeline",
            node: isRooms ? (
              <TimelinePanel key="timeline" events={config.timeline} sectionLabel={vocab.timelineLabel} />
            ) : (
              <Timeline key="timeline" events={config.timeline} />
            ),
          },
        ]
      : []),
    ...(config.photoGalleryEnabled && config.galleryPhotos?.length
      ? [
          {
            key: "gallery",
            label: "Gallery",
            node: isRooms ? (
              <PhotoGalleryPanel key="gallery" photos={config.galleryPhotos} sectionLabel={vocab.galleryLabel} />
            ) : (
              <PhotoGallery key="gallery" photos={config.galleryPhotos} />
            ),
          },
        ]
      : []),
    {
      key: "venue",
      label: "Venue",
      node: isRooms ? (
        <VenueDetailsPanel key="venue" details={config.venueDetails} sectionLabel={vocab.venueLabel} />
      ) : (
        <VenueDetails key="venue" details={config.venueDetails} />
      ),
    },
    ...(config.dressCodeEnabled && config.dressCode
      ? [
          {
            key: "dresscode",
            label: "Dress Code",
            node: isRooms ? (
              <DressCodePanel key="dresscode" dressCode={config.dressCode} sectionLabel={vocab.attireLabel} />
            ) : (
              <DressCode key="dresscode" dressCode={config.dressCode} />
            ),
          },
        ]
      : []),
    ...(config.accommodationEnabled && config.accommodation?.options.length
      ? [
          {
            key: "accommodation",
            label: "Accommodation",
            node: isRooms ? (
              <AccommodationPanel
                key="accommodation"
                accommodation={config.accommodation}
                headingLabel={vocab.accommodationCardLabel}
                introLabel={vocab.accommodationIntro}
              />
            ) : (
              <Accommodation
                key="accommodation"
                accommodation={config.accommodation}
              />
            ),
          },
        ]
      : []),
    ...(config.eventPartyEnabled && config.eventParty?.length
      ? [
          {
            key: "eventParty",
            label: vocab.partyLabel,
            node: isRooms ? (
              <EventPartyPanel
                key="eventParty"
                members={config.eventParty}
                bride={host1}
                groom={host2}
                sectionLabel={vocab.partyLabel}
                honourLabel={vocab.honourLabel}
                brideSideLabel={vocab.brideSideLabel}
                groomSideLabel={vocab.groomSideLabel}
              />
            ) : (
              <EventParty
                key="eventParty"
                members={config.eventParty}
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
            node: isRooms ? (
              <FAQPanel key="faq" items={config.faq} sectionLabel={vocab.faqLabel} />
            ) : (
              <FAQ key="faq" items={config.faq} />
            ),
          },
        ]
      : []),
    ...(config.livestreamEnabled && config.livestreamUrl
      ? [
          {
            key: "livestream",
            label: "Livestream",
            node: isRooms ? (
              <LivestreamPanel
                key="livestream"
                url={config.livestreamUrl}
                title={config.livestreamTitle}
                note={config.livestreamNote}
                date={config.date}
                sectionLabel={vocab.eventLabel}
              />
            ) : (
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
            node: isRooms ? (
              <TravelGuidePanel
                key="travel"
                items={config.travelItems}
                city={location.value ?? ""}
                sectionLabel={vocab.travelLabel}
              />
            ) : (
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
      node: isRooms ? (
        <EventMenuPanel
          key="menu"
          courses={config.menuCourses}
          label={vocab.menuLabel}
          subLabel={vocab.menuSubLabel}
          description={vocab.menuDescription}
        />
      ) : (
        <EventMenu
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
      node: isRooms ? (
        <RSVPPanel
          key="rsvp"
          eventId={config.id}
          enabled={config.rsvpEnabled}
          rsvpDeadline={config.rsvpDeadline}
          eventLabel={vocab.eventLabel}
          sectionLabel={vocab.rsvpLabel}
        />
      ) : (
        <RSVP
          key="rsvp"
          eventId={config.id}
          enabled={config.rsvpEnabled}
          rsvpDeadline={config.rsvpDeadline}
          eventLabel={vocab.eventLabel}
        />
      ),
    },
    ...(config.cashGiftEnabled ||
    (config.registryEnabled &&
      (registryItemCount === undefined || registryItemCount > 0))
      ? [
          {
            key: "registry",
            label: vocab.registryLabel,
            node: isRooms ? (
              <RegistryPanel
                key="registry"
                eventSlug={config.slug}
                label={vocab.registryLabel}
                cashGiftEnabled={config.cashGiftEnabled}
                cashGift={config.cashGift}
              />
            ) : (
              <Registry
                key="registry"
                eventSlug={config.slug}
                label={vocab.registryLabel}
                cashGiftEnabled={config.cashGiftEnabled}
                cashGift={config.cashGift}
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
            node: isRooms ? (
              <GuestBookPanel
                key="guestbook"
                eventId={config.id ?? ""}
                enabled={config.guestBookEnabled!}
                sectionLabel={vocab.guestBookLabel}
              />
            ) : (
              <GuestBook
                key="guestbook"
                eventId={config.id ?? ""}
                enabled={config.guestBookEnabled!}
              />
            ),
          },
        ]
      : []),
    {
      key: "finale",
      label: "Finale",
      node: isRooms ? (
        <FinalePanel
          key="finale"
          bride={host1}
          groom={host2}
          finaleTagLine={config.finaleTagLine}
          finaleHeading={vocab.finaleHeading}
          date={config.date}
          eventType={config.eventType}
          showCoupleIllustration={vocab.showCoupleIllustration}
        />
      ) : (
        <Finale
          key="finale"
          bride={host1}
          groom={host2}
          finaleTagLine={config.finaleTagLine}
          finaleHeading={vocab.finaleHeading}
          date={config.date}
          showCoupleIllustration={vocab.showCoupleIllustration}
          isRooms={false}
        />
      ),
    },
  ];

  return [...always, ...revealed];
}
