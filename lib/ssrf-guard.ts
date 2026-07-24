import { promises as dns } from "dns";
import { isIP } from "net";

/**
 * Checks whether an IPv4 address (as a dotted-quad string) falls in a
 * private/internal/link-local range — including the cloud metadata address
 * 169.254.169.254, which lets an SSRF read cloud credentials if unblocked.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // malformed — fail closed
  const [a, b] = parts;

  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 carrier-grade NAT
  return false;
}

/** Checks whether an IPv6 address falls in a private/internal/link-local range. */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower === "::") return true; // unspecified
  if (lower.startsWith("fe80:") || lower.startsWith("fe8")) return true; // fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
  // IPv4-mapped (::ffff:a.b.c.d) — unwrap and check the embedded IPv4
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivateIP(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // not a recognizable IP — fail closed
}

export interface SsrfCheckResult {
  ok: boolean;
  message?: string;
}

/**
 * Validates a user-supplied URL is safe to fetch server-side: http(s) only,
 * not a literal private/loopback/link-local host, and — resolving DNS — not
 * a public-looking hostname that actually points at an internal address
 * (DNS rebinding). Callers should re-check `res.url` after following
 * redirects, since a redirect can point to a blocked address too.
 */
export async function assertPublicUrl(url: string): Promise<SsrfCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, message: "Invalid URL format." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, message: "URL must use http or https." };
  }

  // Node's URL API keeps the brackets on an IPv6 literal hostname
  // (e.g. "[::1]") — strip them so isIP()/range checks see the bare address.
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { ok: false, message: "That URL is not allowed." };
  }

  // If the hostname is itself a literal IP, check it directly.
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      return { ok: false, message: "That URL is not allowed." };
    }
    return { ok: true };
  }

  // Resolve DNS and check every returned address — a hostname can have
  // multiple A/AAAA records, and an attacker-controlled DNS server can
  // return a public address on first lookup and a private one later
  // (rebinding), so this is a best-effort check, not a guarantee.
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.length === 0) {
      return { ok: false, message: "Could not resolve that URL." };
    }
    if (records.some((r) => isPrivateIP(r.address))) {
      return { ok: false, message: "That URL is not allowed." };
    }
  } catch {
    return { ok: false, message: "Could not resolve that URL." };
  }

  return { ok: true };
}

/**
 * fetch() with SSRF protection: validates the URL (and DNS-resolved
 * address) before every hop, and follows redirects manually so a validated
 * public URL can't 302 the request to an internal address after the fact.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const check = await assertPublicUrl(currentUrl);
    if (!check.ok) {
      throw new Error(check.message ?? "That URL is not allowed.");
    }

    const res = await fetch(currentUrl, { ...init, redirect: "manual" });

    // "manual" redirect mode surfaces 3xx as an opaqueredirect/redirect
    // response rather than following it — extract the target and re-validate.
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      currentUrl = new URL(res.headers.get("location")!, currentUrl).toString();
      continue;
    }

    return res;
  }
  throw new Error("Too many redirects.");
}
