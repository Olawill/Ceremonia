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

export interface WeddingConfig {
  id: string;
  slug: string;
  bride: string;
  groom: string;
  tagLine?: string;
  finaleTagLine?: string;
  date: string; // ISO string "2026-07-12"
  venueDetails: VenueEvent[];
  themeKey: ThemeKey;
  customTheme?: WeddingTheme;
  curtainStyle: "velvet" | "drape";
  audioUrl?: string;
  heroPhotoUrl?: string;
  timeline: TimelineEvent[];
  menuCourses: Course[];
  rsvpEnabled: boolean;
  rsvpDeadline?: string;
  published: boolean;
  passwordProtected: boolean;
}

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
};
