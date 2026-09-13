import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

const ALLOWED_DEV_ORIGINS = [
  "http://localhost:3000",
  process.env.NGROK_URL,
].filter(Boolean) as string[];

function getCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function isAllowedOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "development") {
    return (
      ALLOWED_DEV_ORIGINS.includes(origin) ||
      /^https?:\/\/.*\.ngrok-free\.app$/.test(origin) ||
      /^https?:\/\/.*\.ngrok\.io$/.test(origin)
    );
  }
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || "ceremonia.cc";
  return origin === `https://${rootDomain}`;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const origin = req.headers.get("origin") ?? "";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const allowed = isAllowedOrigin(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS" && isApiRoute) {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? getCorsHeaders(origin) : {},
    });
  }

  if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/ingest")) {
    return NextResponse.next();
  }

  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // Determine subdomain
  // In dev: localhost:3000 → no subdomain
  // In prod: isabella-alexander.ceremonia.cc → "isabella-alexander"
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || "ceremonia.cc";
  const isLocalhost = host.includes("localhost");
  const isNgrok =
    host.endsWith(".ngrok-free.app") || host.endsWith(".ngrok.io");
  const isDevTunnel = isLocalhost || isNgrok;

  let subdomain: string | null = null;

  if (isDevTunnel) {
    // For localhost: "demo.localhost:3000" → subdomain = "demo"
    // For ngrok: no subdomain extraction (treat as root)
    if (isLocalhost) {
      // dev: "demo.localhost:3000" → subdomain = "demo"
      // "localhost:3000" → no subdomain
      const withoutPort = host.split(":")[0]; // strip :3000
      const parts = withoutPort.split(".");
      if (parts.length > 1 && !["app", "www", "ceremonia"].includes(parts[0])) {
        subdomain = parts[0];
      }
    }
  } else {
    // prod: "isabella-alexander.ceremonia.cc"
    const parts = host.replace(`.${rootDomain}`, "").split(".");
    if (parts.length === 1 && !["app", "www", "ceremonia"].includes(parts[0])) {
      subdomain = parts[0];
    }
  }

  // If it's a event subdomain, rewrite to /event/[slug]
  if (subdomain) {
    url.pathname = `/event/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Only treat as custom domain if it's NOT a dev tunnel
  if (!isDevTunnel && !host.endsWith(rootDomain)) {
    url.pathname = `/event/domain/${host}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Attach CORS headers to API responses
  const response = NextResponse.next();
  if (isApiRoute && allowed && origin) {
    Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|ingest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
