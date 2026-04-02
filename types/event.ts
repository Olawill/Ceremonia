import type { EventTheme, ThemeKey } from "@/types/theme";

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

export interface TimelineEvent {
  year: string;
  icon: string;
  title: string;
  desc: string;
}

export interface Course {
  course: string;
  items: string[];
}

export interface VenueEvent {
  label: string; // e.g. "Ceremony"
  value: string; // e.g. "4:00 PM"
  sub: string; // e.g. "Grand Ballroom"
}

export const CURTAIN_STYLES = [
  "velvet",
  "drape",
  "sheer",
  "cascade",
  "iris",
  "split",
  "veil",
] as const;

export type CurtainStyle = (typeof CURTAIN_STYLES)[number];

export const ENTRY_STYLES = ["curtain", "envelope"] as const;
export type EntryStyle = (typeof ENTRY_STYLES)[number];

export const NAV_MODES = ["scroll", "rooms"] as const;
export type NavMode = (typeof NAV_MODES)[number];

export const FEATURE_MODES = [
  "castle",
  "farm",
  "arcade",
  "garden",
  "beach",
] as const;
export type FeatureMode = (typeof FEATURE_MODES)[number];

export interface TravelItem {
  type: "hotel" | "airport" | "tip";
  name: string;
  description: string;
  link?: string;
}

export interface EventConfig {
  id: string;
  slug: string;
  eventType: EventType;
  customDomain?: string;
  bride: string;
  groom: string;
  /** Neutral alias for bride — use for non-wedding events */
  host1Name?: string;
  /** Neutral alias for groom — use for non-wedding events */
  host2Name?: string;
  tagLine?: string;
  finaleTagLine?: string;
  date: string; // ISO string "2026-07-12"
  venueDetails: VenueEvent[];
  themeKey: ThemeKey;
  customTheme?: EventTheme;
  curtainStyle: CurtainStyle;
  entryStyle?: EntryStyle;
  navMode?: NavMode;
  featureMode?: FeatureMode;
  audioUrl?: string;
  heroPhotoUrl?: string;
  timeline: TimelineEvent[];
  menuCourses: Course[];
  rsvpEnabled: boolean;
  rsvpDeadline?: string;
  published: boolean;
  passwordProtected: boolean;
  password?: string;
  notificationEmail?: string;
  registryEnabled?: boolean;
  timelineEnabled?: boolean;
  photoGalleryEnabled?: boolean;
  galleryPhotos?: string[]; // Vercel Blob URLs
  travelGuideEnabled?: boolean;
  travelItems?: TravelItem[];
  guestBookEnabled?: boolean;
  dressCode?: DressCodeConfig;
  dressCodeEnabled?: boolean;
  accommodationEnabled?: boolean;
  accommodation?: AccommodationConfig;
  eventPartyEnabled?: boolean;
  eventParty?: EventPartyMember[];
  faqEnabled?: boolean;
  faq?: FaqItem[];
  livestreamEnabled?: boolean;
  livestreamUrl?: string;
  livestreamTitle?: string;
  livestreamNote?: string;
}

export function getFeatureMode(eventType: EventType): FeatureMode {
  switch (eventType) {
    case "wedding":
    case "engagement":
    case "anniversary":
      return "castle";
    case "birthday":
    case "graduation":
    case "corporate":
      return "arcade";
    case "baby_shower":
    case "bridal_shower":
    case "christening":
      return "garden";
    case "housewarming":
      return "farm";
    default:
      return "castle";
  }
}

export type DressCodeStyle =
  // Western formal
  | "black-tie"
  | "black-tie-optional"
  | "cocktail"
  | "smart-casual"
  | "garden-party"
  | "beach-formal"
  | "casual"
  // Cultural / traditional
  | "traditional" // catch-all for custom traditional attire
  | "african-formal" // agbada, aso-ebi, kente, etc.
  | "south-asian-formal" // sarees, lehengas, sherwanis, etc.
  | "east-asian-formal" // qipao, hanbok, kimono, etc.
  | "middle-eastern" // thobes, abayas, kaftan-formal
  | "latin-formal" // guayabera, huipil, festa attire
  | "smart-traditional"; // mix of traditional + smart — common at multicultural weddings

export interface DressCodeConfig {
  style: DressCodeStyle;
  title?: string; // override e.g. "Dress to Impress"
  description?: string; // free-text guidance
  colourPalette?: string[]; // suggested hex colours guests should wear
  avoidColours?: string[]; // colours to avoid (e.g. white, ivory)
  notes?: string; // extra notes e.g. "Heels not recommended — outdoor venue"
}

export interface AccommodationOption {
  id: string;
  name: string;
  description?: string;
  address?: string;
  distanceFromVenue?: string; // e.g. "5 min walk"
  pricePerNight?: string; // e.g. "£180/night"
  bookingDeadline?: string; // ISO date string
  bookingUrl?: string;
  phone?: string;
  stars?: 1 | 2 | 3 | 4 | 5;
  blockCode?: string; // group booking code
  imageUrl?: string;
}

export interface AccommodationConfig {
  intro?: string; // e.g. "We've reserved a room block at the following hotels"
  options: AccommodationOption[];
}

export type EventPartyRole =
  | "maid-of-honour"
  | "best-man"
  | "bridesmaid"
  | "groomsman"
  | "flower-girl"
  | "ring-bearer"
  | "usher"
  | "mother-of-bride"
  | "father-of-bride"
  | "mother-of-groom"
  | "father-of-groom"
  | "godparent"
  | "godmother"
  | "godfather"
  | "parent"
  | "host"
  | "guest_of_honour"
  | "custom";

export interface EventPartyMember {
  id: string;
  name: string;
  role: EventPartyRole;
  customRole?: string; // used when role === "custom"
  relation?: string; // e.g. "Childhood best friend"
  photoUrl?: string;
  side: "bride" | "groom" | "both";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FALLBACK_LOCATION: VenueEvent = {
  label: "Location",
  value: "Ashford Estate",
  sub: "Tuscany, Italy",
};

// A safe "demo" config used during development / preview
export const DEMO_EVENT_CONFIG: EventConfig = {
  id: "demo",
  slug: "demo",
  eventType: "wedding",
  bride: "Taiwo",
  groom: "Tayo",
  tagLine: "A Cup of T 2026",
  finaleTagLine:
    "Together with our families, we joyfully invite you to witness our union in love.",
  date: "2026-07-12",
  venueDetails: [
    { label: "Ceremony", value: "4:00 PM", sub: "Grand Ballroom" },
    { label: "Reception", value: "7:00 PM", sub: "Garden Terrace" },
    { label: "Location", value: "Ashford Estate", sub: "Tuscany, Italy" },
  ],
  themeKey: "royal",
  curtainStyle: "velvet",
  timelineEnabled: true,
  timeline: [
    {
      year: "2019",
      icon: "✦",
      title: "First Meeting",
      desc: "Two souls crossed paths at a gallery opening in Florence. One glance changed everything.",
    },
    {
      year: "2021",
      icon: "❧",
      title: "The Proposal",
      desc: "On a moonlit evening in Venice, Alexander asked the question that sealed their fate forever.",
    },
    {
      year: "2026",
      icon: "❧",
      title: "Forever Begins",
      desc: "Join us as we begin the greatest adventure of our lives, surrounded by everyone we love.",
    },
  ],
  menuCourses: [
    {
      course: "Amuse-Bouche",
      items: [
        "Truffle Arancini",
        "Burrata Crostini with Fig Jam",
        "Smoked Salmon Blini",
      ],
    },
    {
      course: "First Course",
      items: [
        "Seared Scallops · Cauliflower Purée · Caviar",
        "Heirloom Tomato Salad · Burrata · Basil Oil",
      ],
    },
    {
      course: "Main Course",
      items: [
        "Beef Tenderloin · Bordelaise · Pommes Dauphine",
        "Pan-Seared Sea Bass · Beurre Blanc · Asparagus",
        "Wild Mushroom Risotto · Parmesan · Herbs (V)",
      ],
    },
    {
      course: "Dessert",
      items: [
        "Wedding Cake · Champagne Buttercream",
        "Crème Brûlée · Seasonal Berries",
      ],
    },
  ],
  rsvpEnabled: true,
  published: true,
  passwordProtected: false,
  password: undefined,
  notificationEmail: undefined,
  registryEnabled: true,
  guestBookEnabled: true,
  dressCodeEnabled: true,
  dressCode: {
    style: "black-tie",
    description: "We invite you to dress in your finest evening wear.",
    colourPalette: ["#1a1a2e", "#2d4a3e", "#8b6914"],
    avoidColours: ["#ffffff", "#f5f0e8"],
    notes: "The ceremony is outdoors — stilettos may sink into the lawn.",
  },
  accommodationEnabled: true,
  accommodation: {
    intro:
      "We have arranged preferential rates at the following hotels. Please book before the deadline to secure the group rate.",
    options: [
      {
        id: "1",
        name: "The Grand Ashford",
        description: "Our wedding venue hotel — the most convenient option.",
        address: "1 Ashford Lane, Tuscany, Italy",
        distanceFromVenue: "On-site",
        pricePerNight: "£220/night",
        bookingDeadline: "2026-05-01",
        bookingUrl: "https://example.com",
        stars: 5,
        blockCode: "WEDDING2026",
      },
      {
        id: "2",
        name: "Villa Rosso",
        description: "A charming boutique hotel in the village.",
        address: "Via Roma 12, Tuscany, Italy",
        distanceFromVenue: "10 min drive",
        pricePerNight: "£140/night",
        bookingDeadline: "2026-05-15",
        bookingUrl: "https://example.com",
        stars: 4,
      },
    ],
  },
  eventPartyEnabled: true,
  eventParty: [
    {
      id: "1",
      name: "Sophia Clarke",
      role: "maid-of-honour",
      relation: "Childhood best friend",
      side: "bride",
    },
    {
      id: "2",
      name: "James Okafor",
      role: "best-man",
      relation: "University roommate",
      side: "groom",
    },
    {
      id: "3",
      name: "Amara Diallo",
      role: "bridesmaid",
      relation: "Sister",
      side: "bride",
    },
    {
      id: "4",
      name: "Daniel Park",
      role: "groomsman",
      relation: "Cousin",
      side: "groom",
    },
  ],
  faqEnabled: true,
  faq: [
    {
      id: "1",
      question: "Is there a dress code?",
      answer:
        "We kindly request black tie attire. Think floor-length gowns and tuxedos — we want everyone looking and feeling their most glamorous.",
    },
    {
      id: "2",
      question: "Can I bring a plus one?",
      answer:
        "Due to limited venue capacity, we are only able to accommodate guests listed on the invitation. We hope you understand.",
    },
    {
      id: "3",
      question: "Are children welcome?",
      answer:
        "While we love your little ones, our reception is an adults-only affair. We hope this gives you a chance to enjoy a rare night out!",
    },
    {
      id: "4",
      question: "What time should I arrive?",
      answer:
        "Please arrive at least 15 minutes before the ceremony begins at 4:00 PM. Latecomers may need to wait until after the processional to be seated.",
    },
    {
      id: "5",
      question: "Is the venue accessible?",
      answer:
        "Yes, the Ashford Estate is fully accessible. Please contact us directly if you have specific requirements and we will do everything we can to accommodate you.",
    },
  ],
  livestreamEnabled: true,
  livestreamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  livestreamTitle: "Watch Live",
  livestreamNote:
    "The stream will go live 30 minutes before the ceremony begins. You do not need an account to watch.",
};

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
  /** Countdown section label */
  countdownLabel: string;
  /** FAQ section label */
  faqLabel: string;
  /** Photo gallery section label */
  galleryLabel: string;
  /** Venue details section label */
  venueLabel: string;
  /** Timeline section label */
  timelineLabel: string;
  /** Travel guide section label */
  travelLabel: string;
  /** Guest book section label */
  guestBookLabel: string;
  /** RSVP section label */
  rsvpLabel: string;
  /** Sub-heading for the party panel — e.g. "Hall of Honour" */
  honourLabel: string;
  /** Bride's side label in the party panel — e.g. "Bride's Side" */
  brideSideLabel: string;
  /** Groom's side label in the party panel — e.g. "Groom's Side" */
  groomSideLabel: string;
  /** Scratch/reveal section — pre-reveal heading */
  revealTitle: string;
  /** Scratch/reveal section — helper text */
  revealHint: string;
  /** Intro text shown on the Accommodation intro wall */
  accommodationIntro: string;
  /** Label for individual hotel cards on Accommodation wall */
  accommodationCardLabel: string;
  /** Rooms-mode scroll prompt (shown at the hero) */
  roomsNavPrompt: string;
  /** Whether to show the couple illustration in the finale */
  showCoupleIllustration: boolean;
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Our Story",
    travelLabel: "Travel",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch the golden foil below",
    accommodationIntro:
      "We've arranged preferential rates at the following hotels. Please book before the deadline to secure the group rate.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to begin the journey →",
    showCoupleIllustration: true,
    rsvpLabel: "RSVP",
    honourLabel: "Hall of Honour",
    brideSideLabel: "Bride's Side",
    groomSideLabel: "Groom's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal the Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      "We've picked some great places to stay nearby. Book early for the best rates.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to join the celebration →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Guest of Honour",
    brideSideLabel: "Celebrant's Side",
    groomSideLabel: "Partner's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      "We've arranged accommodation suggestions for our guests. Please book by the deadline.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to meet the little one →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Godparents & Family",
    brideSideLabel: "Mum's Side",
    groomSideLabel: "Partner's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      " Accommodation suggestions for guests traveling to the ceremony.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to share the blessing →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Family & Godparents",
    brideSideLabel: "Godfamily Side",
    groomSideLabel: "Family Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal the Date",
    revealHint: "Scratch to reveal",
    accommodationIntro: "A selection of places to stay near the venue.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to celebrate the bride →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Bridal Party",
    brideSideLabel: "Bride's Side",
    groomSideLabel: "Bridesmaid's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Our Journey",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch to reveal",
    accommodationIntro: "Recommended places to stay for out-of-town guests.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to see the new home →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Our Circle",
    brideSideLabel: "Partner's Side",
    groomSideLabel: "Co-host's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Our Journey",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      "A selection of hotels for guests traveling to celebrate with us.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to celebrate with us →",
    showCoupleIllustration: true,
    rsvpLabel: "RSVP",
    honourLabel: "Friends & Family",
    brideSideLabel: "Partner's Side",
    groomSideLabel: "Co-host's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal the Date",
    revealHint: "Scratch to reveal",
    accommodationIntro: "Places to stay for guests joining the celebration.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to share the moment →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Class of [Year]",
    brideSideLabel: "Graduate's Side",
    groomSideLabel: "Friends & Family",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Our Story",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal Our Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      "Hotel recommendations for guests traveling to the celebration.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to celebrate with us →",
    showCoupleIllustration: true,
    rsvpLabel: "RSVP",
    honourLabel: "Couple's Circle",
    brideSideLabel: "Partner's Side",
    groomSideLabel: "Co-host's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Agenda",
    travelLabel: "Travel",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal the Date",
    revealHint: "Scratch to reveal",
    accommodationIntro:
      "Accommodation options for visiting delegates and guests.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to explore the event →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Guests of Honour",
    brideSideLabel: "Guest's Side",
    groomSideLabel: "Co-host's Side",
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
    countdownLabel: "Countdown",
    faqLabel: "FAQ",
    galleryLabel: "Gallery",
    venueLabel: "Venue",
    timelineLabel: "Timeline",
    travelLabel: "Getting There",
    guestBookLabel: "Guestbook",
    revealTitle: "Reveal the Date",
    revealHint: "Scratch to reveal",
    accommodationIntro: "A selection of places to stay for our guests.",
    accommodationCardLabel: "Where to Stay",
    roomsNavPrompt: "Navigate to continue →",
    showCoupleIllustration: false,
    rsvpLabel: "RSVP",
    honourLabel: "Our Circle",
    brideSideLabel: "Host's Side",
    groomSideLabel: "Co-host's Side",
  },
};

/** Convenience helper — always returns a vocabulary object */
export function getVocabulary(
  eventType: EventType = "wedding",
): EventVocabulary {
  return EVENT_VOCABULARY[eventType] ?? EVENT_VOCABULARY.wedding;
}
