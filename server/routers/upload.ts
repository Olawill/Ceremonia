import { bearer } from "@elysiajs/bearer";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { users } from "@/db/schema";

import { PLAN_FEATURES } from "@/lib/plans";

import { getPostHogClient } from "@/lib/posthog-server";
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

      // Fetch the remote file - Validate URL shape
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(body.url);
      } catch {
        return status(400, { message: "Invalid URL format." });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return status(400, { message: "URL must use http or https." });
      }

      // Block private/internal addresses
      const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
      if (
        blocked.some((h) => parsedUrl.hostname.includes(h)) ||
        parsedUrl.hostname.endsWith(".local")
      ) {
        return status(400, { message: "That URL is not allowed." });
      }

      let res: Response;
      try {
        res = await fetch(parsedUrl.toString(), {
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
