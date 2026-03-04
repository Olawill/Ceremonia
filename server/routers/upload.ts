import { bearer } from "@elysiajs/bearer";
import { put } from "@vercel/blob";
import { Elysia, t } from "elysia";

import { getAuthUserId } from "@/server/auth";

export const uploadRouter = new Elysia({ prefix: "/upload" })
  .use(bearer())

  // POST /api/upload — multipart file upload
  .post(
    "/",
    async ({ body, bearer, status }) => {
      const userId = await getAuthUserId(bearer);
      if (!userId) return status(401, { message: "Unauthorized" });

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
  );
