// ─── Stock assets (no API key — Unsplash source + curated mp3s) ──────────────

import { StockPhoto } from "@/server/routers/stock";

export const STOCK_PHOTO_CATEGORIES = [
  "All",
  "Ceremony",
  "Reception",
  "Florals",
  "Details",
  "Couple",
] as const;
export type PhotoCategory = (typeof STOCK_PHOTO_CATEGORIES)[number];

export const STOCK_PHOTOS: {
  label: string;
  thumb: string;
  full: string;
  category: PhotoCategory;
}[] = [
  // Ceremony
  {
    label: "Garden arch",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=60",
    full: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
  },
  {
    label: "Candle aisle",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=200&q=60",
    full: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=1600&q=80",
  },
  {
    label: "Outdoor ceremony",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=200&q=60",
    full: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1600&q=80",
  },
  {
    label: "Chapel interior",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200&q=60",
    full: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=80",
  },
  {
    label: "Vows exchange",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&q=60",
    full: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80",
  },
  {
    label: "Confetti toss",
    category: "Ceremony",
    thumb:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&q=60",
    full: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=80",
  },
  // Reception
  {
    label: "Reception hall",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=200&q=60",
    full: "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1600&q=80",
  },
  {
    label: "Floral table",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200&q=60",
    full: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
  },
  {
    label: "First dance",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?w=200&q=60",
    full: "https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?w=1600&q=80",
  },
  {
    label: "Champagne toast",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=200&q=60",
    full: "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=1600&q=80",
  },
  {
    label: "Wedding cake",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=200&q=60",
    full: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1600&q=80",
  },
  {
    label: "Evening fairy lights",
    category: "Reception",
    thumb:
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=200&q=60",
    full: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1600&q=80",
  },
  // Florals
  {
    label: "Bouquet",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1525543907401-4b4dac8e2a0a?w=200&q=60",
    full: "https://images.unsplash.com/photo-1525543907401-4b4dac8e2a0a?w=1600&q=80",
  },
  {
    label: "Rose centrepiece",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1487530811015-780da5f58a06?w=200&q=60",
    full: "https://images.unsplash.com/photo-1487530811015-780da5f58a06?w=1600&q=80",
  },
  {
    label: "Peony arch",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1490750967868-88df5691cc9d?w=200&q=60",
    full: "https://images.unsplash.com/photo-1490750967868-88df5691cc9d?w=1600&q=80",
  },
  {
    label: "Wild meadow",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1444930694458-01babf71acd5?w=200&q=60",
    full: "https://images.unsplash.com/photo-1444930694458-01babf71acd5?w=1600&q=80",
  },
  {
    label: "Buttonhole",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=200&q=60",
    full: "https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=1600&q=80",
  },
  {
    label: "Table runner blooms",
    category: "Florals",
    thumb:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
    full: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
  },
  // Details
  {
    label: "Rings on flowers",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=200&q=60",
    full: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1600&q=80",
  },
  {
    label: "Invitation flatlay",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1517722014278-c256a91a6fba?w=200&q=60",
    full: "https://images.unsplash.com/photo-1517722014278-c256a91a6fba?w=1600&q=80",
  },
  {
    label: "Shoes & heels",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&q=60",
    full: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1600&q=80",
  },
  {
    label: "Candles & rings",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=60",
    full: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
  },
  {
    label: "Place settings",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&q=60",
    full: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80",
  },
  {
    label: "Vintage keys",
    category: "Details",
    thumb:
      "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=200&q=60",
    full: "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1600&q=80",
  },
  // Couple
  {
    label: "Sunset couple",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1529636798458-92182e662485?w=200&q=60",
    full: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=1600&q=80",
  },
  {
    label: "Walking together",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=200&q=60",
    full: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1600&q=80",
  },
  {
    label: "Forehead kiss",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=200&q=60",
    full: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=1600&q=80",
  },
  {
    label: "Golden hour",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&q=60",
    full: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600&q=80",
  },
  {
    label: "Dip kiss",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=200&q=60",
    full: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1600&q=80",
  },
  {
    label: "Hand in hand",
    category: "Couple",
    thumb:
      "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=200&q=60",
    full: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=1600&q=80",
  },
];

export const STOCK_AUDIO_CATEGORIES = [
  "All",
  "Classical",
  "Romantic",
  "Ambient",
  "Cinematic",
] as const;
export type AudioCategory = (typeof STOCK_AUDIO_CATEGORIES)[number];

export const STOCK_AUDIO: {
  label: string;
  preview: string;
  full: string;
  category: AudioCategory;
}[] = [
  // Classical
  {
    label: "Canon in D — Pachelbel",
    category: "Classical",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    label: "Air on G String — Bach",
    category: "Classical",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    label: "Clair de Lune — Debussy",
    category: "Classical",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    label: "Wedding March — Mendelssohn",
    category: "Classical",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    label: "Bridal Chorus — Wagner",
    category: "Classical",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  // Romantic
  {
    label: "A Thousand Years — Piano",
    category: "Romantic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    label: "Perfect — Acoustic Cover",
    category: "Romantic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    label: "Thinking Out Loud — Strings",
    category: "Romantic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    label: "Lover — Piano Ballad",
    category: "Romantic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  {
    label: "All of Me — Jazz Piano",
    category: "Romantic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  },
  // Ambient
  {
    label: "Morning Mist",
    category: "Ambient",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  },
  {
    label: "Garden at Dusk",
    category: "Ambient",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  },
  {
    label: "Soft Rain & Piano",
    category: "Ambient",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  },
  {
    label: "Warm Strings",
    category: "Ambient",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  },
  // Cinematic
  {
    label: "Grand Arrival",
    category: "Cinematic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  },
  {
    label: "Eternal Vows",
    category: "Cinematic",
    preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    full: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
  },
];

export function getFallbackPhotos(): StockPhoto[] {
  return STOCK_PHOTOS.map((p, i) => ({
    id: `fallback-${i}`,
    thumb: p.thumb,
    full: p.full,
    label: p.label,
    category: p.category,
    source: "unsplash" as const,
  }));
}
