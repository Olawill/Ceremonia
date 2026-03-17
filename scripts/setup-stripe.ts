// scripts/setup-stripe.ts
// Run with: npx tsx scripts/setup-stripe.ts
import { stripe } from "@/lib/stripe";
import * as fs from "fs";
import * as path from "path";

interface PriceResult {
  productId: string;
  priceId: string;
  name: string;
  amount: number;
  type: string;
}

async function createProduct(
  name: string,
  description: string,
): Promise<string> {
  const product = await stripe.products.create({ name, description });
  console.log(`✦ Created product: ${name} (${product.id})`);
  return product.id;
}

async function createPrice(
  productId: string,
  amount: number, // in cents
  nickname: string,
  recurring?: { interval: "month" | "year" },
): Promise<PriceResult> {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "usd",
    nickname,
    ...(recurring ? { recurring } : {}),
  });
  console.log(`  ↳ Price: ${nickname} — $${amount / 100} — ${price.id}`);
  return {
    productId,
    priceId: price.id,
    name: nickname,
    amount: amount / 100,
    type: recurring ? `${recurring.interval}ly` : "one_time",
  };
}

async function main() {
  console.log("\n✦ Ceremonia — Stripe Product Setup\n");

  const results: Record<string, string> = {};

  // ── STARTER ──────────────────────────────────────────────────────────
  const starterId = await createProduct(
    "Ceremonia Starter",
    "1 event, all built-in themes, custom audio, unlimited RSVPs, no watermark",
  );
  const starterMonthly = await createPrice(starterId, 900, "Starter Monthly", {
    interval: "month",
  });
  const starterOnce = await createPrice(
    starterId,
    2900,
    "Starter One-time",
    undefined,
  );
  results["NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY"] = starterMonthly.priceId;
  results["NEXT_PUBLIC_STRIPE_PRICE_STARTER_ONCE"] = starterOnce.priceId;

  // ── PRO ──────────────────────────────────────────────────────────────
  const proId = await createProduct(
    "Ceremonia Pro",
    "Up to 5 events, custom theme builder, analytics, CSV export, custom domain",
  );
  const proMonthly = await createPrice(proId, 1900, "Pro Monthly", {
    interval: "month",
  });
  results["NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY"] = proMonthly.priceId;

  // ── AGENCY ───────────────────────────────────────────────────────────
  const agencyId = await createProduct(
    "Ceremonia Agency",
    "Unlimited events, white-label, theme marketplace, API access",
  );
  const agencyMonthly = await createPrice(agencyId, 7900, "Agency Monthly", {
    interval: "month",
  });
  results["NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY"] = agencyMonthly.priceId;

  // ── PORTAL CONFIGURATION ─────────────────────────────────────────────
  // Create the portal config now that we have all product + price IDs
  const portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your Ceremonia subscription",
      privacy_policy_url: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
      terms_of_service_url: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
    },
    features: {
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: [
            "too_expensive",
            "missing_features",
            "switched_service",
            "other",
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: [
          {
            product: starterId,
            prices: [starterMonthly.priceId, starterOnce.priceId],
          },
          {
            product: proId,
            prices: [proMonthly.priceId],
          },
          {
            product: agencyId,
            prices: [agencyMonthly.priceId],
          },
        ],
      },
      invoice_history: { enabled: true },
    },
  });

  console.log(`✦ Portal configuration created: ${portalConfig.id}`);
  results["STRIPE_PORTAL_CONFIG_ID"] = portalConfig.id;

  // ── Write env file ────────────────────────────────────────────────────
  const envLines = Object.entries(results)
    .map(([key, val]) => `${key}=${val}`)
    .join("\n");

  const envPath = path.resolve(process.cwd(), ".env.stripe.local");
  fs.writeFileSync(envPath, envLines + "\n");

  console.log("\n✦ Done! IDs written to .env.stripe.local\n");
  console.log("─────────────────────────────────────────────");
  console.log(envLines);
  console.log("─────────────────────────────────────────────");
  console.log("\nCopy these into your .env.local file.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
