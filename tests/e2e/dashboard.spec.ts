import { expect, test } from "@playwright/test";
import fs from "fs";

const authExists = fs.existsSync("tests/e2e/.auth/user.json");

// ── Unauthenticated — always runs ────────────────────────────────────────────

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to sign-in when not authenticated", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("editor redirects to sign-in when not authenticated", async ({
    page,
  }) => {
    await page.goto("/app/editor");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("billing redirects to sign-in when not authenticated", async ({
    page,
  }) => {
    await page.goto("/app/billing");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("settings redirects to sign-in when not authenticated", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    await expect(page).toHaveURL(/sign-in/);
  });
});

// ── Authenticated — skipped until auth file is generated ─────────────────────

test.describe("Dashboard (authenticated)", () => {
  test.skip(
    !authExists,
    "Auth file not found — run tests/e2e/auth.setup.ts first",
  );
  test.use({
    storageState: authExists
      ? "tests/e2e/.auth/user.json"
      : { cookies: [], origins: [] },
  });

  test("shows dashboard overview", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page.getByText(/Your Events/i)).toBeVisible();
  });

  test("editor redirects or loads", async ({ page }) => {
    await page.goto("/app/editor");
    await page.waitForURL(/\/app\/editor/);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("billing page shows plan tiers", async ({ page }) => {
    await page.goto("/app/billing");
    await expect(page.locator("[data-tier-id='free']")).toBeVisible();
    await expect(page.locator("[data-tier-id='pro']")).toBeVisible();
    await expect(page.locator("[data-tier-id='starter']")).toBeVisible();
    await expect(page.locator("[data-tier-id='agency']")).toBeVisible();
  });
});
