import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // Determine subdomain
  // In dev: localhost:3000 → no subdomain
  // In prod: isabella-alexander.ceremonia.app → "isabella-alexander"
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || "ceremonia.app";
  const isLocalhost = host.includes("localhost");

  let subdomain: string | null = null;

  if (!isLocalhost) {
    // e.g. host = "isabella-alexander.ceremonia.app"
    const parts = host.replace(`.${rootDomain}`, "").split(".");
    // Only treat as wedding subdomain if it's a single-part subdomain
    if (parts.length === 1 && !["app", "www", "ceremonia"].includes(parts[0])) {
      subdomain = parts[0];
    }
  }

  // If it's a wedding subdomain, rewrite to /wedding/[slug]
  if (subdomain) {
    url.pathname = `/wedding/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
