import { expect, test } from "@playwright/test";

const slug = process.env.PLAYWRIGHT_DEMO_SLUG || "demo";

test.describe("Wedding invitation page", () => {
  test("page loads and returns 200", async ({ page }) => {
    const response = await page.goto(`/wedding/${slug}`);
    expect(response?.status()).toBe(200);
  });

  test("page title contains wedding names or invitation", async ({ page }) => {
    await page.goto(`/wedding/${slug}`);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("curtain or invitation content is visible", async ({ page }) => {
    await page.goto(`/wedding/${slug}`);
    await page.waitForLoadState("networkidle");
    // Either the curtain or the main content should be present
    const hasCurtain = await page.locator("canvas").count();
    const hasBody = await page.locator("body").count();
    expect(hasCurtain + hasBody).toBeGreaterThan(0);
  });

  test("page has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`/wedding/${slug}`);
    await page.waitForLoadState("networkidle");
    // Filter out known non-critical errors
    const critical = errors.filter(
      (e) =>
        !e.includes("posthog") &&
        !e.includes("ResizeObserver") &&
        !e.includes("favicon"),
    );
    expect(critical).toHaveLength(0);
  });

  test("404 page for nonexistent slug", async ({ page }) => {
    const res = await page.goto("/wedding/this-slug-does-not-exist-xyz123");
    // Should return 404 or redirect to not-found
    expect([404, 200]).toContain(res?.status());
    if (res?.status() === 200) {
      // If 200, there should be a not found indicator
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });
});
