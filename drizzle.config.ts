import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

// Load .env.local first (dev), fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
