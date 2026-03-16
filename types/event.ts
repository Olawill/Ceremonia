export const EVENT_TYPES = [
  "wedding",
  "birthday",
  "baby_shower",
  "christening",
  "bridal_shower",
  "housewarming",
  "anniversary",
  "graduation",
  "engagement",
  "corporate",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Per-event-type vocabulary — controls all the UI labels so nothing says
 * "Bride", "Groom", or "Wedding" when the event is a birthday party.
 */
export interface EventVocabulary {
  /** What we call "the event" — "Wedding", "Birthday Party", etc. */
  eventLabel: string;
  /** Singular label for the primary host */
  host1Label: string;
  /** Singular label for the secondary host (undefined if single-host event) */
  host2Label?: string;
  /** Whether a second host name is relevant */
  dualHost: boolean;
  /** The section formerly called "Wedding Party" */
  partyLabel: string;
  /** The section formerly called "Wedding Menu" */
  menuLabel: string;
  /** The section formerly called "Dress Code" */
  attireLabel: string;
  /** Tag-line placeholder shown in the content editor */
  tagLinePlaceholder: string;
  /** Finale copy — "See You at the Altar", "See You at the Party", etc. */
  finaleHeading: string;
  /** New event CTA label shown in NewEventDialog */
  newEventCta: string;
  /** New event Hero label shown in Parallax Hero section */
  topLabel: string;
  menuSubLabel: string; // e.g. "Dinner Banquet", "Party Refreshments"
  menuDescription: string; // e.g. "A culinary journey..."
  /** Emoji used as shorthand in the dashboard list */
  emoji: string;
  registryLabel: string;
}

export const EVENT_VOCABULARY: Record<EventType, EventVocabulary> = {
  wedding: {
    eventLabel: "Wedding",
    host1Label: "Bride",
    host2Label: "Groom",
    dualHost: true,
    partyLabel: "Wedding Party",
    menuLabel: "Wedding Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Together with our families, we joyfully invite you…",
    finaleHeading: "See You at the Altar",
    newEventCta: "New Wedding",
    topLabel: "Together in Love",
    emoji: "💍",
    menuSubLabel: "Dinner Banquet",
    menuDescription: "A culinary journey curated with love",
    registryLabel: "Wedding Registry",
  },
  birthday: {
    eventLabel: "Birthday Party",
    host1Label: "Celebrant",
    dualHost: false,
    partyLabel: "Guest of Honour's Circle",
    menuLabel: "Party Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Join us as we celebrate another trip around the sun…",
    finaleHeading: "See You at the Party",
    newEventCta: "New Birthday Party",
    topLabel: "Celebrating Another Year",
    emoji: "🎂",
    menuSubLabel: "Party Refreshments",
    menuDescription: "Food and drinks for the celebration",
    registryLabel: "Wish List",
  },
  baby_shower: {
    eventLabel: "Baby Shower",
    host1Label: "Mum-to-be",
    host2Label: "Partner",
    dualHost: true,
    partyLabel: "Our Circle",
    menuLabel: "Shower Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "A little one is on the way — come celebrate with us!",
    finaleHeading: "See You There",
    newEventCta: "New Baby Shower",
    topLabel: "A New Life is Coming",
    emoji: "🍼",
    menuSubLabel: "Shower Spread",
    menuDescription: "Delicious bites for a special occasion",
    registryLabel: "Baby Registry",
  },
  christening: {
    eventLabel: "Christening",
    host1Label: "Parent",
    host2Label: "Parent",
    dualHost: true,
    partyLabel: "Godparents & Family",
    menuLabel: "Reception Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "We invite you to share in this special blessing…",
    finaleHeading: "See You at the Church",
    newEventCta: "New Christening",
    topLabel: "A Blessed Occasion",
    emoji: "✝️",
    menuSubLabel: "Reception Refreshments",
    menuDescription: "Food and drinks after the service",
    registryLabel: "Gift Registry",
  },
  bridal_shower: {
    eventLabel: "Bridal Shower",
    host1Label: "Bride-to-be",
    dualHost: false,
    partyLabel: "Bridal Party",
    menuLabel: "Brunch Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Before she says I do — celebrate with us!",
    finaleHeading: "See You There",
    newEventCta: "New Bridal Shower",
    topLabel: "Before She Says I Do",
    emoji: "👰",
    menuSubLabel: "Brunch Spread",
    menuDescription: "A lovely brunch curated for the occasion",
    registryLabel: "Gift Ideas",
  },
  housewarming: {
    eventLabel: "Housewarming",
    host1Label: "Host",
    host2Label: "Co-host",
    dualHost: true,
    partyLabel: "Our Circle",
    menuLabel: "Food & Drinks",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Come help us make our new house a home!",
    finaleHeading: "See You at Our New Home",
    newEventCta: "New Housewarming",
    topLabel: "A New Chapter Begins",
    emoji: "🏠",
    menuSubLabel: "Food & Drinks",
    menuDescription: "Come hungry, leave happy",
    registryLabel: "Home Wish List",
  },
  anniversary: {
    eventLabel: "Anniversary",
    host1Label: "Partner",
    host2Label: "Partner",
    dualHost: true,
    partyLabel: "Our Circle",
    menuLabel: "Celebration Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Join us as we celebrate years of love…",
    finaleHeading: "See You at the Celebration",
    newEventCta: "New Anniversary Party",
    topLabel: "Celebrating Our Love",
    emoji: "🥂",
    menuSubLabel: "Celebration Dinner",
    menuDescription: "A special menu for a special evening",
    registryLabel: "Gift Ideas",
  },
  graduation: {
    eventLabel: "Graduation Party",
    host1Label: "Graduate",
    dualHost: false,
    partyLabel: "Friends & Family",
    menuLabel: "Party Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "Hard work paid off — come celebrate!",
    finaleHeading: "See You There",
    newEventCta: "New Graduation Party",
    topLabel: "The Journey Continues",
    emoji: "🎓",
    menuSubLabel: "Party Food",
    menuDescription: "Food and drinks for the celebration",
    registryLabel: "Gift Registry",
  },
  engagement: {
    eventLabel: "Engagement Party",
    host1Label: "Partner",
    host2Label: "Partner",
    dualHost: true,
    partyLabel: "Our Circle",
    menuLabel: "Party Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "We said yes — come celebrate our engagement!",
    finaleHeading: "See You There",
    newEventCta: "New Engagement Party",
    topLabel: "We Said Yes",
    emoji: "💒",
    menuSubLabel: "Engagement Dinner",
    menuDescription: "A menu to celebrate the happy couple",
    registryLabel: "Gift Registry",
  },
  corporate: {
    eventLabel: "Corporate Event",
    host1Label: "Host",
    dualHost: false,
    partyLabel: "Team",
    menuLabel: "Catering",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "You are cordially invited to join us…",
    finaleHeading: "See You There",
    newEventCta: "New Corporate Event",
    topLabel: "You Are Cordially Invited",
    emoji: "💼",
    menuSubLabel: "Catering",
    menuDescription: "Refreshments provided throughout the event",
    registryLabel: "Gift Ideas",
  },
  other: {
    eventLabel: "Event",
    host1Label: "Host",
    host2Label: "Co-host",
    dualHost: true,
    partyLabel: "Our Circle",
    menuLabel: "Menu",
    attireLabel: "Dress Code",
    tagLinePlaceholder: "You are invited to join us…",
    finaleHeading: "See You There",
    newEventCta: "New Event",
    topLabel: "You Are Invited",
    emoji: "🎉",
    menuSubLabel: "Refreshments",
    menuDescription: "Food and drinks for our guests",
    registryLabel: "Gift Registry",
  },
};

/** Convenience helper — always returns a vocabulary object */
export function getVocabulary(
  eventType: EventType = "wedding",
): EventVocabulary {
  return EVENT_VOCABULARY[eventType] ?? EVENT_VOCABULARY.wedding;
}
