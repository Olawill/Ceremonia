import { bearer } from "@elysiajs/bearer";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { users } from "@/db/schema";

import { PLAN_FEATURES } from "@/lib/plans";
import { ingestUsage } from "@/lib/polar-usage";
import { getPostHogClient } from "@/lib/posthog-server";
import { assertPublicUrl, safeFetch } from "@/lib/ssrf-guard";
import { getAuthUserId } from "@/server/auth";

export const uploadRouter = new Elysia({ prefix: "/upload" })
  .use(bearer())

  // POST /api/upload — multipart file upload
  .post(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      // Fetch plan
      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const features = PLAN_FEATURES[owner?.plan ?? "free"];

      if (body.type === "audio" && !features.customAudio) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: userId,
          event: "plan_limit_hit",
          properties: { feature: "custom_audio", plan: owner?.plan },
        });
        await posthog.shutdown();
        return status(403, {
          message: "Custom audio requires the Starter plan.",
        });
      }

      const { file, type } = body;

      // Validate mime type
      if (type === "photo" && !file.type.startsWith("image/")) {
        return status(400, { message: "File must be an image" });
      }
      if (type === "audio" && !file.type.startsWith("audio/")) {
        return status(400, { message: "File must be an audio file" });
      }

      // Max sizes: 10MB photo, 20MB audio
      const maxSize = type === "photo" ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        return status(400, {
          message: `File too large (max ${type === "photo" ? "10MB" : "20MB"})`,
        });
      }

      const ext = file.name.split(".").pop();
      const blob = await put(`${type}s/${userId}/${Date.now()}.${ext}`, file, {
        access: "public",
      });

      ingestUsage("media_uploaded", {
        userId,
        metadata: {
          bytes: file.size,
          type: file.type, // "image" or "audio"
          plan: owner?.plan ?? "free",
        },
      }).catch(() => {});

      return { url: blob.url };
    },
    {
      body: t.Object({
        file: t.File(),
        type: t.Union([t.Literal("photo"), t.Literal("audio")]),
      }),
    },
  )

  // POST /api/upload/from-url — fetch a remote URL and store in Vercel Blob
  .post(
    "/from-url",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

      const [owner] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const features = PLAN_FEATURES[owner?.plan ?? "free"];

      if (body.type === "audio" && !features.customAudio) {
        return status(403, {
          message: "Custom audio requires the Starter plan.",
        });
      }

      // Validate the URL isn't pointing at a private/internal/metadata
      // address (including via DNS resolution) before fetching it.
      const check = await assertPublicUrl(body.url);
      if (!check.ok) {
        return status(400, { message: check.message });
      }

      let res: Response;
      try {
        res = await safeFetch(body.url, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error("Remote fetch failed");
      } catch {
        return status(400, { message: "Could not fetch the URL provided." });
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (body.type === "photo" && !contentType.startsWith("image/")) {
        return status(400, { message: "URL does not point to an image." });
      }
      if (body.type === "audio" && !contentType.startsWith("audio/")) {
        return status(400, { message: "URL does not point to an audio file." });
      }

      const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
      const blob = await put(
        `${body.type}s/${userId}/${Date.now()}.${ext}`,
        res.body!,
        { access: "public", contentType },
      );

      return { url: blob.url };
    },
    {
      body: t.Object({
        url: t.String({ minLength: 10, pattern: "^https?://" }),
        type: t.Union([t.Literal("photo"), t.Literal("audio")]),
      }),
    },
  );
