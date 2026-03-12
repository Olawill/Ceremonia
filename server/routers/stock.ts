import { env } from "@/env";
import { Elysia, t } from "elysia";

export interface StockPhoto {
  id: string;
  thumb: string;
  full: string;
  label: string;
  source: "unsplash" | "pixabay";
  authorName?: string;
  authorUrl?: string;
}

export interface StockAudio {
  id: string;
  label: string;
  preview: string;
  full: string;
  source: "pixabay";
  duration?: number;
}

export const stockRouter = new Elysia({ prefix: "/stock" })

  // GET /api/stock/photos?q=wedding+arch&page=1
  .get(
    "/photos",
    async ({ query, status }) => {
      const q = query.q?.trim() || "wedding";
      const page = Math.max(1, parseInt(query.page ?? "1"));

      const [unsplashRes, pixabayRes] = await Promise.allSettled([
        // Unsplash — 50 req/hour on free tier
        fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&page=${page}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
            },
          },
        ),
        // Pixabay — 100 req/min on free tier
        fetch(
          `https://pixabay.com/api/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&category=backgrounds&per_page=12&page=${page}&safesearch=true`,
        ),
      ]);

      const photos: StockPhoto[] = [];

      // Parse Unsplash
      if (unsplashRes.status === "fulfilled" && unsplashRes.value.ok) {
        const data = await unsplashRes.value.json();
        for (const item of data.results ?? []) {
          photos.push({
            id: `unsplash-${item.id}`,
            thumb: item.urls.small,
            full: item.urls.regular,
            label: item.alt_description ?? item.description ?? "Wedding photo",
            source: "unsplash",
            authorName: item.user?.name,
            authorUrl: item.user?.links?.html,
          });
        }
      }

      // Parse Pixabay
      if (pixabayRes.status === "fulfilled" && pixabayRes.value.ok) {
        const data = await pixabayRes.value.json();
        for (const item of data.hits ?? []) {
          photos.push({
            id: `pixabay-${item.id}`,
            thumb: item.previewURL,
            full: item.webformatURL,
            label: item.tags?.split(",")[0]?.trim() ?? "Wedding photo",
            source: "pixabay",
          });
        }
      }

      if (photos.length === 0) {
        return { photos: [], page };
      }

      return { photos, page };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    },
  )

  // GET /api/stock/audio?q=romantic+piano&page=1
  .get(
    "/audio",
    async ({ query, status }) => {
      const q = query.q?.trim() || "wedding romantic piano";
      const page = Math.max(1, parseInt(query.page ?? "1"));

      // Pixabay has a music API — free, same key
      const res = await fetch(
        `https://pixabay.com/api/videos/music/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&per_page=15&page=${page}`,
      );

      if (!res.ok) {
        return { audio: [], page };
      }

      const data = await res.json();
      const audio: StockAudio[] = (data.hits ?? []).map((item: any) => ({
        id: `pixabay-audio-${item.id}`,
        label: item.title ?? "Wedding music",
        preview: item.audio?.["128"] ?? item.audio?.["64"] ?? item.url,
        full: item.audio?.["128"] ?? item.audio?.["64"] ?? item.url,
        source: "pixabay" as const,
        duration: item.duration,
      }));

      return { audio, page };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.String()),
      }),
    },
  );
