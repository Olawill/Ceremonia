import type { ThemeKey, WeddingTheme } from "@/types/theme";

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

export interface TravelItem {
  type: "hotel" | "airport" | "tip";
  name: string;
  description: string;
  link?: string;
}

export interface WeddingConfig {
  id: string;
  slug: string;
  customDomain?: string;
  bride: string;
  groom: string;
  tagLine?: string;
  finaleTagLine?: string;
  date: string; // ISO string "2026-07-12"
  venueDetails: VenueEvent[];
  themeKey: ThemeKey;
  customTheme?: WeddingTheme;
  curtainStyle: CurtainStyle;
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
  photoGalleryEnabled?: boolean;
  galleryPhotos?: string[]; // Vercel Blob URLs
  travelGuideEnabled?: boolean;
  travelItems?: TravelItem[];
  guestBookEnabled?: boolean;
  dressCode?: DressCodeConfig;
  dressCodeEnabled?: boolean;
  accommodationEnabled?: boolean;
  accommodation?: AccommodationConfig;
  weddingPartyEnabled?: boolean;
  weddingParty?: WeddingPartyMember[];
}

export type DressCodeStyle =
  | "black-tie"
  | "black-tie-optional"
  | "cocktail"
  | "smart-casual"
  | "garden-party"
  | "beach-formal"
  | "casual";

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

export type WeddingPartyRole =
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
  | "custom";

export interface WeddingPartyMember {
  id: string;
  name: string;
  role: WeddingPartyRole;
  customRole?: string; // used when role === "custom"
  relation?: string; // e.g. "Childhood best friend"
  photoUrl?: string;
  side: "bride" | "groom" | "both";
}

export const FALLBACK_LOCATION: VenueEvent = {
  label: "Location",
  value: "Ashford Estate",
  sub: "Tuscany, Italy",
};

// A safe "demo" config used during development / preview
export const DEMO_WEDDING_CONFIG: WeddingConfig = {
  id: "demo",
  slug: "demo",
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
  weddingPartyEnabled: true,
  weddingParty: [
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
};
