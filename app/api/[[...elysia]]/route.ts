import { app } from "@/server";

// Elysia handles GET, POST, PATCH, DELETE
export const GET = app.handle;
export const POST = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;
