import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("body")).not.toBeEmpty();
    // Clerk renders its own UI — just confirm the page doesn't crash
    await expect(page).not.toHaveURL(/error/);
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page).not.toHaveURL(/error/);
  });

  test("dashboard redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");
    // Should end up on sign-in
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test("editor redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/app/editor");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test("billing redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/app/billing");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test("settings redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});
