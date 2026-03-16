import { test as setup } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

// Uses Clerk's built-in test mode:
// - Any email with +clerk_test suffix is a test address
// - No real email is sent
// - OTP code is always 424242
// Docs: https://clerk.com/docs/guides/development/testing/test-emails-and-phones

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;

  if (!email) {
    throw new Error(
      "TEST_USER_EMAIL must be set in .env.local to generate auth state",
    );
  }

  await page.goto("/sign-in");

  // Wait for Clerk's identifier input
  await page.waitForSelector("input[name=identifier]", { timeout: 15000 });
  await page.fill("input[name=identifier]", email);
  await page.locator(".cl-formButtonPrimary").click();

  // Clerk shows either a password field or an OTP field depending on your
  // instance configuration. Handle both cases:
  const nextInput = await Promise.race([
    page
      .waitForSelector("input[type=password]", { timeout: 8000 })
      .catch(() => null),
    page
      .waitForSelector("input[name=code]", { timeout: 8000 })
      .catch(() => null),
    // page
    //   .waitForSelector("[data-input-otp='true']", { timeout: 8000 })
    //   .catch(() => null),
  ]);

  if (!nextInput) {
    throw new Error(
      "Neither password nor OTP field appeared after entering email",
    );
  }

  const inputType = await nextInput.getAttribute("name");
  // const inputType = await nextInput?.getAttribute("data-input-otp");

  if (inputType === "code") {
    // OTP flow — enter the magic test code
    const code = process.env.TEST_EMAIL_CODE;
    if (!code)
      throw new Error("TEST_EMAIL_CODE must be set for code-based sign-in");
    await page.fill("input[name=code]", code);
  } else {
    // Password flow — use a known password for the test account
    const password = process.env.TEST_USER_PASSWORD;
    if (!password)
      throw new Error(
        "TEST_USER_PASSWORD must be set for password-based sign-in",
      );
    await page.fill("input[type=password]", password);
    await page.locator(".cl-formButtonPrimary").click();

    // Clerk may follow up with a code verification step even after password
    const codeField = await page
      .waitForSelector("[data-input-otp='true']", { timeout: 8000 })
      .catch(() => null);

    if (codeField) {
      await page.fill("[data-input-otp='true']", "424242");
      // await page.locator(".cl-formButtonPrimary").click();
    }

    if (page.url().includes("factor-two")) {
      const otpField = await page
        .waitForSelector("[data-input-otp='true']", { timeout: 8000 })
        .catch(() => null);
      if (otpField) {
        await page.fill("[data-input-otp='true']", "424242");
        await page.locator(".cl-formButtonPrimary").click();
      }
    }
  }

  // Wait until we've landed on the dashboard
  await page.waitForURL(/\/app\/dashboard/, { timeout: 45000 });

  await page.context().storageState({ path: authFile });
  console.log(`✦ Auth state saved to ${authFile}`);
});
