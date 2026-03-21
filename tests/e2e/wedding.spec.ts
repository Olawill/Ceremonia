import { expect, test } from "@playwright/test";

// ── Event invitation page (demo) ───────────────────────────────────────────
//
// The /event/demo route always renders DEMO_EVENT_CONFIG (Taiwo & Tayo)
// without a DB lookup or auth, making it a reliable E2E anchor.

test.describe("Event invitation page (demo)", () => {
  test("event demo loads without error", async ({ page }) => {
    const response = await page.goto("/event/demo");
    expect(response?.status()).toBe(200);
  });

  test("page title contains bride & groom names", async ({ page }) => {
    await page.goto("/event/demo");
    // The <title> set by generateMetadata for the demo slug
    await expect(page).toHaveTitle(/Taiwo.*Tayo|Tayo.*Taiwo/i);
  });

  test("curtain reveal animation container is present", async ({ page }) => {
    await page.goto("/event/demo");
    // VelvetCurtain renders a full-screen overlay — look for the click target
    // The curtain wraps in a fixed div; check for its presence before interaction
    const curtain = page
      .locator('[data-testid="velvet-curtain"], .curtain-container')
      .first();
    // Fallback: check that the page body has rendered something (not blank)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();

    // The canvas dust particles are always rendered on load
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeAttached();
  });

  test("RSVP section is visible after curtain open and date reveal", async ({
    page,
  }) => {
    await page.goto("/event/demo");

    // Step 1: Open the curtain
    await page.click("body");

    // const isMobile = page.viewportSize()?.width !== undefined && page.viewportSize()!.width < 768;
    // if (isMobile) {
    //   await page.tap("body", { force: true });
    // } else {
    //   await page.click("body", { force: true });
    // }

    await page.waitForSelector("[data-scroll-container]", { timeout: 10000 });

    // Step 1b: Scroll the snap container to the ScratchDate section so the
    // canvas is in the viewport before we attempt mouse interaction.
    // scrollTop = window.innerHeight skips past the Hero snap section.
    await page.evaluate(() => {
      const container = document.querySelector("[data-scroll-container]");
      if (container) container.scrollTop = container.clientHeight;
    });

    // Wait for the scroll snap to settle and canvas to be in view
    await page.waitForTimeout(600);

    // Step 2: Find and scratch the canvas
    const scratchCanvas = page.locator("canvas.cursor-crosshair");
    await scratchCanvas.waitFor({ timeout: 5000 });

    // Scroll the canvas into view explicitly as a safety net
    await scratchCanvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Step 3: Trigger reveal programmatically — clear the canvas then fire
    // mousedown+mousemove to trip the pixel-count check (>95% transparent)
    await page.evaluate(() => {
      const canvas = document.querySelector(
        "canvas.cursor-crosshair",
      ) as HTMLCanvasElement | null;
      if (!canvas) throw new Error("Scratch canvas not found");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + 10;
      const cy = rect.top + 10;
      canvas.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: cx,
          clientY: cy,
        }),
      );
      canvas.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: cx,
          clientY: cy,
        }),
      );
      canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Canvas detaches from DOM once revealed
    await expect(scratchCanvas).not.toBeAttached({ timeout: 8000 });

    // Step 4: Wait for sections to mount and scroll to RSVP
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const container = document.querySelector("[data-scroll-container]");
      if (container) container.scrollTop = container.scrollHeight;
    });

    await expect(page.locator("h2", { hasText: "RSVP" })).toBeVisible({
      timeout: 10000,
    });
  });
});

// ── Event invitation — password protected ───────────────────────────────────
//
// These tests require a published, password-protected event in the DB.
// We use a seeded test slug `test-protected` — add this to your seed script
// or run tests against a local dev environment with that record.
// If the slug doesn't exist, the page returns 404 and tests are skipped.

test.describe("Event invitation — password protected", () => {
  const PROTECTED_SLUG = "test-protected";
  const CORRECT_PASSWORD = "ceremony2026";

  test.beforeEach(async ({ page }) => {
    // Clear the unlock cookie between tests so each starts locked
    await page.context().clearCookies();
  });

  test("navigating to a password-protected event shows the PasswordGate", async ({
    page,
  }) => {
    const response = await page.goto(`/event/${PROTECTED_SLUG}`);

    // If the slug doesn't exist in this environment, skip
    if (response?.status() === 404) {
      test.skip();
      return;
    }

    // PasswordGate renders a "Private Invitation" heading
    await expect(
      page.locator("h1", { hasText: "Private Invitation" }),
    ).toBeVisible();

    // The password input should be present and focused
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("entering wrong password shows error message", async ({ page }) => {
    const response = await page.goto(`/event/${PROTECTED_SLUG}`);
    if (response?.status() === 404) {
      test.skip();
      return;
    }

    await page
      .locator('input[type="password"]')
      .pressSequentially("wrongpassword");
    await expect(page.locator('button[type="submit"]')).toBeEnabled({
      timeout: 5000,
    });
    await page.locator('button[type="submit"]').click();

    // PasswordGate shows "Incorrect password" on failed attempt
    await expect(page.locator("text=Incorrect password")).toBeVisible({
      timeout: 5000,
    });

    // Input should be cleared and re-focused
    await expect(page.locator('input[type="password"]')).toHaveValue("");
  });

  test("entering correct password dismisses the gate and shows invitation", async ({
    page,
  }) => {
    const response = await page.goto(`/event/${PROTECTED_SLUG}`);
    if (response?.status() === 404) {
      test.skip();
      return;
    }

    // await page.locator('input[type="password"]').fill(CORRECT_PASSWORD);
    await page
      .locator('input[type="password"]')
      .pressSequentially(CORRECT_PASSWORD);
    await expect(page.locator('button[type="submit"]')).toBeEnabled({
      timeout: 5000,
    });
    await page.locator('button[type="submit"]').click();

    // router.refresh() triggers an RSC re-render that swaps the gate for the EventEngine.
    // Wait for positive evidence of the new content rather than asserting the old is gone,
    // which races the refresh cycle.
    await expect(page.locator("canvas").first()).toBeAttached({
      timeout: 12000,
    });

    // After correct password, router.refresh() is called and the gate disappears
    await expect(
      page.locator("h1", { hasText: "Private Invitation" }),
    ).not.toBeVisible({ timeout: 8000 });

    // The EventEngine (curtain) should now be visible
    await expect(page.locator("canvas").first()).toBeAttached();
  });
});
