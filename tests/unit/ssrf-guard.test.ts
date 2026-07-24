import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("dns", () => {
  const promises = { lookup: vi.fn() };
  return { promises, default: { promises } };
});

import { promises as dns } from "dns";
import { assertPublicUrl } from "@/lib/ssrf-guard";

const mockLookup = dns.lookup as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
});

describe("assertPublicUrl", () => {
  it("rejects invalid URL strings", async () => {
    const r = await assertPublicUrl("not a url");
    expect(r.ok).toBe(false);
  });

  it("rejects non-http(s) protocols", async () => {
    const r = await assertPublicUrl("file:///etc/passwd");
    expect(r.ok).toBe(false);
  });

  it("rejects localhost and .local/.internal hosts", async () => {
    for (const url of [
      "http://localhost/x",
      "http://foo.localhost/x",
      "http://internal.local/x",
      "http://service.internal/x",
    ]) {
      expect((await assertPublicUrl(url)).ok).toBe(false);
    }
  });

  it("rejects literal private/loopback/link-local IPv4 addresses", async () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "0.0.0.0",
    ]) {
      const r = await assertPublicUrl(`http://${ip}/x`);
      expect(r.ok).toBe(false);
    }
  });

  it("rejects literal private IPv6 addresses", async () => {
    for (const ip of ["[::1]", "[fe80::1]", "[fc00::1]"]) {
      const r = await assertPublicUrl(`http://${ip}/x`);
      expect(r.ok).toBe(false);
    }
  });

  it("accepts a literal public IPv4 address", async () => {
    const r = await assertPublicUrl("http://93.184.216.34/x");
    expect(r.ok).toBe(true);
  });

  it("accepts a public hostname that resolves to a public IP", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const r = await assertPublicUrl("https://example.com/photo.jpg");
    expect(r.ok).toBe(true);
  });

  it("rejects a public-looking hostname that resolves to a private IP (DNS rebinding)", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    const r = await assertPublicUrl("https://attacker.example/x");
    expect(r.ok).toBe(false);
  });

  it("rejects a hostname with multiple records if ANY resolved address is private", async () => {
    mockLookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "169.254.169.254", family: 4 }, // cloud metadata sneaked in
    ]);
    const r = await assertPublicUrl("https://mixed.example/x");
    expect(r.ok).toBe(false);
  });

  it("rejects when DNS resolution fails", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    const r = await assertPublicUrl("https://nonexistent.invalid/x");
    expect(r.ok).toBe(false);
  });
});
