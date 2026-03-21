import { themes } from "@/themes";
import { describe, expect, it, vi } from "vitest";

describe("Theme definitions", () => {
  const themeKeys = Object.keys(themes);

  it("has at least one theme defined", () => {
    expect(themeKeys.length).toBeGreaterThan(0);
  });

  it.each(themeKeys)('theme "%s" has all required colour fields', (key) => {
    const theme = themes[key as keyof typeof themes];
    expect(theme.gold).toMatch(/^#/);
    expect(theme.bg).toMatch(/^#/);
    expect(theme.text).toMatch(/^#/);
    expect(theme.curtain).toMatch(/^#/);
  });

  it("royal theme exists", () => {
    expect(themes).toHaveProperty("royal");
  });
});

describe("defaultThemeKey fallback", () => {
  it("falls back to 'royal' when env var is not set", async () => {
    // The env mock in setup.ts sets NEXT_PUBLIC_EVENT_THEME — temporarily clear it
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_EVENT_THEME: undefined,
      },
    }));
    const { defaultThemeKey } = await import("@/themes/index");
    expect(defaultThemeKey).toBe("royal");
    vi.doUnmock("@/env");
    vi.resetModules();
  });
});
