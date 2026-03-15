import { describe, expect, it } from "vitest";

// Test the subdomain extraction logic in isolation
// We extract just the pure logic from middleware to unit test it
function extractSubdomain(host: string, rootDomain: string): string | null {
  const isLocalhost = host.includes("localhost");
  if (isLocalhost) {
    const withoutPort = host.split(":")[0];
    const parts = withoutPort.split(".");
    if (parts.length > 1 && !["app", "www", "ceremonia"].includes(parts[0])) {
      return parts[0];
    }
    return null;
  }
  const parts = host.replace(`.${rootDomain}`, "").split(".");
  if (parts.length === 1 && !["app", "www", "ceremonia"].includes(parts[0])) {
    return parts[0];
  }
  return null;
}

describe("Subdomain extraction", () => {
  const root = "ceremonia.app";

  it("extracts subdomain in production", () => {
    expect(extractSubdomain("isabella-alexander.ceremonia.app", root)).toBe(
      "isabella-alexander",
    );
  });

  it("returns null for app subdomain", () => {
    expect(extractSubdomain("app.ceremonia.app", root)).toBeNull();
  });

  it("returns null for root domain", () => {
    expect(extractSubdomain("ceremonia.app", root)).toBeNull();
  });

  it("extracts subdomain in localhost dev", () => {
    expect(extractSubdomain("demo.localhost:3000", root)).toBe("demo");
  });

  it("returns null for plain localhost", () => {
    expect(extractSubdomain("localhost:3000", root)).toBeNull();
  });

  it("returns null for www", () => {
    expect(extractSubdomain("www.ceremonia.app", root)).toBeNull();
  });
});
