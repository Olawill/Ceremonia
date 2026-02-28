// db/index.ts
// This file is the ONLY place that knows about the DB driver.
// To switch from Docker Postgres → Neon: just change DATABASE_URL in .env

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Works for both local Docker and Neon (Neon URLs start with postgres://)
const connectionString = process.env.DATABASE_URL!;

// For serverless (Neon), we disable prepared statements.
// For local Docker postgres-js, this is ignored.
const client = postgres(connectionString, {
  prepare: false, // Required for Neon serverless
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
