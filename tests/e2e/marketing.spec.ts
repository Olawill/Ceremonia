import { expect, test } from "@playwright/test";

test.describe("Marketing page", () => {
  test("loads and shows hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /your love story/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows all four pricing tier names", async ({ page }) => {
    await page.goto("/");
    // Use exact label text inside the pricing cards (the <p> plan name labels)
    // getByText with exact avoids matching "Start free" for "Free"
    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Starter", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Agency", { exact: true }).first(),
    ).toBeVisible();
  });

  test("shows pricing amounts", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$9/mo")).toBeVisible();
    await expect(page.getByText("$19/mo")).toBeVisible();
    await expect(page.getByText("$79/mo")).toBeVisible();
  });

  test("primary CTA links to sign-up", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /Create your invitation/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /sign-up/);
  });

  test("demo link is present", async ({ page }) => {
    await page.goto("/");
    const demo = page.getByRole("link", { name: /See the demo/i });
    await expect(demo).toBeVisible();
    await expect(demo).toHaveAttribute("href", /demo/);
  });

  test("nav shows get started link", async ({ page }) => {
    await page.goto("/");
    // "Get started" is always visible on all viewports
    await expect(
      page.getByRole("link", { name: /get started/i }),
    ).toBeVisible();
  });

  test("sign in link is visible on desktop", async ({ page }) => {
    // Sign in has `hidden md:inline-flex` so only check on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("shows Ceremonia brand in nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Ceremonia").first()).toBeVisible();
  });

  test("shows feature pills", async ({ page }) => {
    await page.goto("/");
    // Use exact + first() to target the pill <span> not the paragraph that contains the text
    await expect(
      page.getByText("RSVP management", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Custom themes & colours", { exact: true }).first(),
    ).toBeVisible();
  });

  test("footer shows copyright", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/Ceremonia/i).last()).toBeVisible();
  });
});
