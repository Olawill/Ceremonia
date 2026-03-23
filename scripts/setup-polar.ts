// scripts/setup-polar.ts
// Run with: bun run scripts/setup-polar.ts
//
// What this does:
//   1. Creates 4 products in your Polar org (Starter Monthly, Starter Once,
//      Pro Monthly, Agency Monthly)
//   2. Registers a webhook pointing at your app's /api/webhooks/polar endpoint
//   3. Writes all resulting IDs + your access token to .env.polar.local
//
// Prerequisites:
//   - POLAR_ACCESS_TOKEN in your environment (or .env.local)
//   - NEXT_PUBLIC_APP_URL in your environment (or .env.local)
//   - POLAR_SERVER=sandbox|production (defaults to sandbox)
//
// Usage:
//   bun run scripts/setup-polar.ts
//   bun run scripts/setup-polar.ts --production   ← targets production Polar

import * as dotenv from "dotenv";

// ── Load env ──────────────────────────────────────────────────────────────────
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const IS_PRODUCTION =
  process.argv.includes("--production") ||
  process.env.POLAR_SERVER === "production";

const BASE_URL = IS_PRODUCTION
  ? "https://api.polar.sh"
  : "https://sandbox-api.polar.sh";

const ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!ACCESS_TOKEN) {
  console.error(
    "\n✖ POLAR_ACCESS_TOKEN is not set.\n" +
      "  Get one from: https://polar.sh/settings/personal-access-tokens\n" +
      "  (or https://sandbox.polar.sh for sandbox)\n",
  );
  process.exit(1);
}

if (!APP_URL) {
  console.error(
    "\n✖ NEXT_PUBLIC_APP_URL is not set.\n" +
      "  Set it in .env.local (e.g. https://ceremonia.app or https://your-ngrok-url)\n",
  );
  process.exit(1);
}

interface MeterResult {
  id: string;
  name: string;
}

// ── Polar API helpers ─────────────────────────────────────────────────────────

async function polarFetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Polar API ${method} ${endpoint} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

interface PolarOrg {
  id: string;
  name: string;
  slug: string;
}

interface PolarProduct {
  id: string;
  name: string;
}

interface PolarWebhook {
  id: string;
  url: string;
  secret: string;
}

// ── Get the authenticated org ─────────────────────────────────────────────────

async function getOrg(): Promise<PolarOrg> {
  // List organizations the token has access to
  const res = await polarFetch<{ items: PolarOrg[] }>(
    "GET",
    "/organizations?limit=1",
  );
  const org = res.items[0];
  if (!org) {
    throw new Error(
      "No organization found. Make sure your POLAR_ACCESS_TOKEN has org access.",
    );
  }
  return org;
}

// ── Create a product ──────────────────────────────────────────────────────────

interface CreateProductOptions {
  name: string;
  description: string;
  // organizationId: string;
  metadata?: Record<string, string>;
  amountInCents: number;
  isRecurring: boolean;
  recurringInterval?: "month" | "year";
}

async function createProduct(
  opts: CreateProductOptions,
): Promise<PolarProduct> {
  // Price shape is identical for both recurring and one-time —
  // the product-level recurring_interval is what distinguishes them
  const price = {
    amount_type: "fixed",
    price_amount: opts.amountInCents,
    price_currency: "usd",
  };

  const product = await polarFetch<PolarProduct>("POST", "/products", {
    name: opts.name,
    description: opts.description,
    // organization_id: opts.organizationId,
    prices: [price],
    // recurring_interval present = subscription, absent = one-time purchase
    ...(opts.isRecurring && opts.recurringInterval
      ? { recurring_interval: opts.recurringInterval }
      : {}),
    ...(opts.metadata ? { metadata: opts.metadata } : {}),
  });

  const typeLabel = opts.isRecurring
    ? `$${opts.amountInCents / 100}/mo recurring`
    : `$${opts.amountInCents / 100} one-time`;

  console.log(`  ✦ Created: ${opts.name} (${typeLabel}) → ${product.id}`);
  return product;
}

// ── Register webhook ──────────────────────────────────────────────────────────

import * as crypto from "crypto";

async function createWebhook(webhookUrl: string): Promise<PolarWebhook> {
  // Generate a random secret locally — we send it to Polar, not the other way around
  const secret = crypto.randomBytes(32).toString("hex");

  const webhook = await polarFetch<PolarWebhook>(
    "POST",
    "/webhooks/endpoints",
    {
      url: webhookUrl,
      secret,
      events: ["customer.state_changed", "order.paid", "order.created"],
    },
  );

  console.log(`  ✦ Webhook registered → ${webhook.url}`);
  console.log(`    Secret: ${secret}`);
  return { ...webhook, secret }; // merge secret in since we own it
}

async function attachBenefitToProduct(
  productId: string,
  benefitIds: string[],
): Promise<void> {
  await polarFetch<unknown>("POST", `/products/${productId}/benefits`, {
    benefits: benefitIds,
  });
  console.log(
    `  ✦ Attached ${benefitIds.length} benefit(s) to product ${productId}`,
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = IS_PRODUCTION ? "production" : "sandbox";
  console.log(`\n✦ Ceremonia — Polar Product Setup (${env})\n`);
  console.log(`  API: ${BASE_URL}`);
  console.log(`  App: ${APP_URL}\n`);

  // ── 1. Resolve org ──────────────────────────────────────────────────
  // console.log("── Organisation ──────────────────────────────────────────────");
  // const org = await getOrg();
  // console.log(`  ✦ Using org: ${org.name} (${org.id})\n`);

  // const results: Record<string, string> = {};

  // // ── 2. Create products ──────────────────────────────────────────────
  // console.log("── Products ──────────────────────────────────────────────────");

  // const starterMonthly = await createProduct({
  //   name: "Ceremonia Starter (Monthly)",
  //   description:
  //     "1 event · All built-in themes · Both curtain styles · Custom audio · Unlimited RSVPs · No watermark · RSVP email notifications",
  //   // organizationId: org.id,
  //   amountInCents: 900,
  //   isRecurring: true,
  //   recurringInterval: "month",
  //   metadata: {
  //     plan: "starter",
  //     billing: "monthly",
  //     max_events: "1",
  //     hosting: "active_subscription",
  //     rsvp_emails: "true",
  //     new_themes: "true",
  //     watermark: "false",
  //     custom_audio: "true",
  //     rsvp_limit: "unlimited",
  //     custom_theme_builder: "false",
  //     password_protection: "false",
  //     analytics: "false",
  //     csv_export: "false",
  //     custom_domain: "false",
  //     white_label: "false",
  //     api_access: "false",
  //   },
  // });
  // results["NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY"] = starterMonthly.id;

  // const starterOnce = await createProduct({
  //   name: "Ceremonia Starter (One-time)",
  //   description:
  //     "1 event · All built-in themes · Both curtain styles · Custom audio · Unlimited RSVPs · No watermark · Pay once, yours forever",
  //   // organizationId: org.id,
  //   amountInCents: 2900,
  //   isRecurring: false,
  //   metadata: {
  //     plan: "starter",
  //     billing: "one_time",
  //     max_events: "1",
  //     hosting: "24_months",
  //     rsvp_emails: "false",
  //     new_themes: "false",
  //     watermark: "false",
  //     custom_audio: "true",
  //     rsvp_limit: "unlimited",
  //     custom_theme_builder: "false",
  //     password_protection: "false",
  //     analytics: "false",
  //     csv_export: "false",
  //     custom_domain: "false",
  //     white_label: "false",
  //     api_access: "false",
  //   },
  // });
  // results["NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE"] = starterOnce.id;

  // const proMonthly = await createProduct({
  //   name: "Ceremonia Pro (Monthly)",
  //   description:
  //     "Up to 5 events · Custom theme builder · Save & reuse themes · Password protection · Analytics dashboard · CSV RSVP export · Custom domain",
  //   // organizationId: org.id,
  //   amountInCents: 1900,
  //   isRecurring: true,
  //   recurringInterval: "month",
  //   metadata: {
  //     plan: "pro",
  //     billing: "monthly",
  //     max_events: "5",
  //     hosting: "active_subscription",
  //     rsvp_emails: "true",
  //     new_themes: "true",
  //     watermark: "false",
  //     custom_audio: "true",
  //     rsvp_limit: "unlimited",
  //     custom_theme_builder: "true",
  //     password_protection: "true",
  //     analytics: "true",
  //     csv_export: "true",
  //     custom_domain: "true",
  //     white_label: "false",
  //     api_access: "false",
  //   },
  // });
  // results["NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY"] = proMonthly.id;

  // const agencyMonthly = await createProduct({
  //   name: "Ceremonia Agency (Monthly)",
  //   description:
  //     "Unlimited events · White-label branding · Theme marketplace · Client management dashboard · Bulk RSVP import · API access",
  //   // organizationId: org.id,
  //   amountInCents: 7900,
  //   isRecurring: true,
  //   recurringInterval: "month",
  //   metadata: {
  //     plan: "agency",
  //     billing: "monthly",
  //     max_events: "unlimited",
  //     hosting: "active_subscription",
  //     rsvp_emails: "true",
  //     new_themes: "true",
  //     watermark: "false",
  //     custom_audio: "true",
  //     rsvp_limit: "unlimited",
  //     custom_theme_builder: "true",
  //     password_protection: "true",
  //     analytics: "true",
  //     csv_export: "true",
  //     custom_domain: "true",
  //     white_label: "true",
  //     api_access: "true",
  //   },
  // });
  // results["NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY"] = agencyMonthly.id;

  // console.log();

  // // ── Meters ────────────────────────────────────────────────────────────
  // console.log("── Meters ────────────────────────────────────────────────────");

  // const createMeter = async (
  //   name: string,
  //   displayName: string,
  //   eventName: string,
  //   aggregation: "count" | "sum",
  //   sumProperty?: string,
  // ): Promise<MeterResult> => {
  //   const meter = await polarFetch<MeterResult>("POST", "/meters", {
  //     // organization_id: org.id,
  //     name: displayName,
  //     filter: {
  //       conjunction: "and",
  //       clauses: [{ property: "name", operator: "eq", value: eventName }],
  //     },
  //     aggregation:
  //       aggregation === "sum"
  //         ? { func: "sum", property: sumProperty }
  //         : { func: "count" },
  //   });
  //   console.log(`  ✦ Meter: ${displayName} → ${meter.id}`);
  //   results[`POLAR_METER_${name.toUpperCase()}`] = meter.id;
  //   return meter;
  // };

  // await createMeter(
  //   "events_created",
  //   "Events Created",
  //   "event_created",
  //   "count",
  // );
  // await createMeter("rsvps", "RSVPs Submitted", "rsvp_submitted", "count");
  // await createMeter(
  //   "registry_items",
  //   "Registry Items Added",
  //   "registry_item_added",
  //   "count",
  // );
  // await createMeter(
  //   "registry_scrapes",
  //   "Registry Scrapes",
  //   "registry_scrape",
  //   "count",
  // );
  // await createMeter(
  //   "media_bytes",
  //   "Media Uploaded (bytes)",
  //   "media_uploaded",
  //   "sum",
  //   "bytes",
  // );
  // await createMeter(
  //   "rsvp_emails",
  //   "RSVP Emails Sent",
  //   "rsvp_email_sent",
  //   "count",
  // );

  // console.log();

  // // ── Benefits ─────────────────────────────────────────────────────────
  // console.log("── Benefits ──────────────────────────────────────────────────");

  // const createBenefit = async (
  //   name: string,
  //   description: string,
  //   properties: Record<string, string>,
  // ): Promise<string> => {
  //   const benefit = await polarFetch<{ id: string }>("POST", "/benefits", {
  //     type: "custom",
  //     description,
  //     properties,
  //   });
  //   console.log(`  ✦ Benefit: ${description} → ${benefit.id}`);
  //   results[`POLAR_BENEFIT_${name.toUpperCase()}`] = benefit.id;
  //   return benefit.id;
  // };

  // const starterBenefitId = await createBenefit("starter", "Starter Features", {
  //   max_events: "1",
  //   hosting_duration: "active_subscription",
  //   rsvp_email_notifications: "true",
  //   new_themes: "true",
  //   watermark: "false",
  //   custom_audio: "true",
  //   rsvp_limit: "unlimited",
  //   custom_theme_builder: "false",
  //   password_protection: "false",
  //   analytics: "false",
  //   csv_export: "false",
  //   custom_domain: "false",
  //   white_label: "false",
  //   api_access: "false",
  // });
  // const proBenefitId = await createBenefit("pro", "Pro Features", {
  //   max_events: "5",
  //   hosting_duration: "active_subscription",
  //   rsvp_email_notifications: "true",
  //   new_themes: "true",
  //   watermark: "false",
  //   custom_audio: "true",
  //   rsvp_limit: "unlimited",
  //   custom_theme_builder: "true",
  //   password_protection: "true",
  //   analytics: "true",
  //   csv_export: "true",
  //   custom_domain: "true",
  //   white_label: "false",
  //   api_access: "false",
  // });
  // const agencyBenefitId = await createBenefit("agency", "Agency Features", {
  //   max_events: "unlimited",
  //   hosting_duration: "active_subscription",
  //   rsvp_email_notifications: "true",
  //   new_themes: "true",
  //   watermark: "false",
  //   custom_audio: "true",
  //   rsvp_limit: "unlimited",
  //   custom_theme_builder: "true",
  //   password_protection: "true",
  //   analytics: "true",
  //   csv_export: "true",
  //   custom_domain: "true",
  //   white_label: "true",
  //   api_access: "true",
  // });

  // results["POLAR_BENEFIT_STARTER"] = starterBenefitId;
  // results["POLAR_BENEFIT_PRO"] = proBenefitId;
  // results["POLAR_BENEFIT_AGENCY"] = agencyBenefitId;
  // console.log();

  // // ── Attach benefits to products ───────────────────────────────────────
  // console.log("── Attaching Benefits ────────────────────────────────────────");

  // await attachBenefitToProduct(starterMonthly.id, [starterBenefitId]);
  // await attachBenefitToProduct(starterOnce.id, [starterBenefitId]);
  // await attachBenefitToProduct(proMonthly.id, [proBenefitId]);
  // await attachBenefitToProduct(agencyMonthly.id, [agencyBenefitId]);

  // console.log();

  // ── 3. Register webhook ─────────────────────────────────────────────
  console.log("── Webhook ───────────────────────────────────────────────────");
  const webhookUrl = `${APP_URL}/api/webhooks/polar`;

  let webhookSecret: string;
  try {
    const webhook = await createWebhook(webhookUrl);
    webhookSecret = webhook.secret;
    // results["POLAR_WEBHOOK_SECRET"] = webhookSecret;
    console.log(`POLAR_WEBHOOK_SECRET=${webhookSecret}`);
    console.log();
  } catch (err) {
    // Webhook registration can fail in dev if the URL isn't publicly reachable.
    // Print a warning but don't abort — the user can register manually.
    console.warn(
      `  ⚠ Webhook registration failed: ${(err as Error).message}\n` +
        `  For local dev, install the Polar CLI and run: polar listen http://localhost:3000/\n` +
        `  Or register manually at https://sandbox.polar.sh/settings/webhooks\n` +
        `  Endpoint: ${webhookUrl}\n`,
    );
    webhookSecret = "<register-manually-and-paste-secret-here>";
    // results["POLAR_WEBHOOK_SECRET"] = webhookSecret;
    console.log(`POLAR_WEBHOOK_SECRET=${webhookSecret}`);
    console.log();
  }

  // ── 4. Assemble env block ───────────────────────────────────────────
  const serverLabel = IS_PRODUCTION ? "production" : "sandbox";

  // const envBlock = [
  //   `# Polar (${serverLabel})`,
  //   `# Generated by scripts/setup-polar.ts on ${new Date().toISOString()}`,
  //   `POLAR_ACCESS_TOKEN=${ACCESS_TOKEN}`,
  //   `POLAR_SERVER=${serverLabel}`,
  //   `POLAR_WEBHOOK_SECRET=${results["POLAR_WEBHOOK_SECRET"]}`,
  //   ``,
  //   `# Polar Product IDs`,
  //   `NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY=${results["NEXT_PUBLIC_POLAR_PRODUCT_STARTER_MONTHLY"]}`,
  //   `NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE=${results["NEXT_PUBLIC_POLAR_PRODUCT_STARTER_ONCE"]}`,
  //   `NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY=${results["NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY"]}`,
  //   `NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY=${results["NEXT_PUBLIC_POLAR_PRODUCT_AGENCY_MONTHLY"]}`,
  //   ``,
  //   `POLAR_METER_EVENTS_CREATED=${results["POLAR_METER_EVENTS_CREATED"] ?? ""}`,
  //   `POLAR_METER_RSVPS=${results["POLAR_METER_RSVPS"] ?? ""}`,
  //   `POLAR_METER_REGISTRY_ITEMS=${results["POLAR_METER_REGISTRY_ITEMS"] ?? ""}`,
  //   `POLAR_METER_REGISTRY_SCRAPES=${results["POLAR_METER_REGISTRY_SCRAPES"] ?? ""}`,
  //   `POLAR_METER_MEDIA_BYTES=${results["POLAR_METER_MEDIA_BYTES"] ?? ""}`,
  //   `POLAR_METER_RSVP_EMAILS=${results["POLAR_METER_RSVP_EMAILS"] ?? ""}`,
  //   ``,
  //   `# Polar Benefit IDs`,
  //   `POLAR_BENEFIT_STARTER=${results["POLAR_BENEFIT_STARTER"] ?? ""}`,
  //   `POLAR_BENEFIT_PRO=${results["POLAR_BENEFIT_PRO"] ?? ""}`,
  //   `POLAR_BENEFIT_AGENCY=${results["POLAR_BENEFIT_AGENCY"] ?? ""}`,
  // ].join("\n");

  // ── 5. Write .env.polar.local ───────────────────────────────────────
  // const envPath = path.resolve(process.cwd(), ".env.polar.local");
  // fs.writeFileSync(envPath, envBlock + "\n");

  // ── 6. Print summary ────────────────────────────────────────────────
  console.log("── Done ──────────────────────────────────────────────────────");
  console.log(`\n✦ Written to: .env.polar.local\n`);
  // console.log(envBlock);
  console.log(
    "\n─────────────────────────────────────────────────────────────",
  );
  console.log("\nNext steps:");
  console.log(
    "  1. Copy the contents of .env.polar.local into your .env.local",
  );
  console.log(
    "  2. Remove any STRIPE_* / NEXT_PUBLIC_STRIPE_* lines from .env.local",
  );
  console.log(
    `  3. In Polar dashboard (${
      IS_PRODUCTION ? "polar.sh" : "sandbox.polar.sh"
    }), confirm your products look correct`,
  );
  if (webhookSecret === "<register-manually-and-paste-secret-here>") {
    console.log(
      `  4. Register the webhook manually at the URL above and paste the secret into .env.polar.local`,
    );
  } else {
    console.log(
      `  4. Webhook is already registered — make sure your app is deployed before events fire`,
    );
    console.log(
      "  5. For local webhook testing: install Polar CLI and run `polar listen http://localhost:3000/`",
    );
  }
  console.log();
}

main().catch((err) => {
  console.error("\n✖ Fatal error:", err.message);
  process.exit(1);
});
