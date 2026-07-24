import { env } from "@/env";
import { getAuthUserId } from "@/server/auth";
import bearer from "@elysiajs/bearer";
import { Elysia, t } from "elysia";

export interface StockPhoto {
  id: string;
  thumb: string;
  full: string;
  label: string;
  category?: string;
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
  category?: string;
}

const PER_PAGE = 12;

export const stockRouter = new Elysia({ prefix: "/stock" })
  .use(bearer())

  // GET /api/stock/photos?q=event+arch&page=1
  .get(
    "/photos",
    async ({ query, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const q = query.q?.trim() || "event";
      const category = query.category?.trim() ?? "";
      const page = Math.max(1, parseInt(query.page ?? "1"));

      const [unsplashRes, pixabayRes] = await Promise.allSettled([
        // Unsplash — 50 req/hour on free tier
        fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${PER_PAGE}&page=${page}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
            },
          },
        ),
        // Pixabay — 100 req/min on free tier
        fetch(
          `https://pixabay.com/api/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&category=backgrounds&per_page=${PER_PAGE}&page=${page}&safesearch=true`,
        ),
      ]);

      const photos: StockPhoto[] = [];
      let unsplashTotal = 0;
      let pixabayTotal = 0;

      // Parse Unsplash
      if (unsplashRes.status === "fulfilled" && unsplashRes.value.ok) {
        const data = await unsplashRes.value.json();
        unsplashTotal = data.total ?? 0;
        for (const item of data.results ?? []) {
          photos.push({
            id: `unsplash-${item.id}`,
            thumb: item.urls.small,
            full: item.urls.regular,
            label: item.alt_description ?? item.description ?? "Event photo",
            source: "unsplash",
            authorName: item.user?.name,
            authorUrl: item.user?.links?.html,
          });
        }
      }

      // Parse Pixabay
      if (pixabayRes.status === "fulfilled" && pixabayRes.value.ok) {
        const data = await pixabayRes.value.json();
        pixabayTotal = data.totalHits ?? 0;
        for (const item of data.hits ?? []) {
          photos.push({
            id: `pixabay-${item.id}`,
            thumb: item.previewURL,
            full: item.webformatURL,
            label: item.tags?.split(",")[0]?.trim() ?? "Event photo",
            source: "pixabay",
          });
        }
      }

      if (photos.length === 0) {
        return { photos: [], page, hasMore: false };
      }

      photos.forEach((p) => {
        p.category = category || "All";
      });

      const hasMore =
        unsplashTotal > page * PER_PAGE || pixabayTotal > page * PER_PAGE;

      return { photos, page, hasMore };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    },
  )

  // GET /api/stock/audio?q=romantic+piano&page=1
  .get(
    "/audio",
    async ({ query, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const q = query.q?.trim() || "romantic piano";
      const category = query.category?.trim() ?? "";
      const page = Math.max(1, parseInt(query.page ?? "1"));

      // Build query — if a category is passed append it to help Pixabay's search
      const searchQ =
        category && category !== "All" ? `${q} ${category.toLowerCase()}` : q;

      // Pixabay has a music API — free, same key
      const res = await fetch(
        `https://pixabay.com/api/videos/music/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&per_page=15&page=${page}`,
      );

      if (!res.ok) {
        return { audio: [], page, hasMore: false };
      }

      const data = await res.json();
      const total: number = data.totalHits ?? 0;
      const audio: StockAudio[] = (data.hits ?? []).map((item: any) => ({
        id: `pixabay-audio-${item.id}`,
        label: item.title ?? "Event music",
        preview: item.audio?.["128"] ?? item.audio?.["64"] ?? item.url,
        full: item.audio?.["128"] ?? item.audio?.["64"] ?? item.url,
        source: "pixabay" as const,
        duration: item.duration,
        // Pixabay doesn't return a genre field — we tag by the search category
        category: category || "All",
      }));

      return { audio, page, hasMore: total > page * 15 };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    },
  );
