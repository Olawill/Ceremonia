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
    "1 wedding, all built-in themes, custom audio, unlimited RSVPs, no watermark",
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
  results["STRIPE_PRICE_STARTER_MONTHLY"] = starterMonthly.priceId;
  results["STRIPE_PRICE_STARTER_ONCE"] = starterOnce.priceId;

  // ── PRO ──────────────────────────────────────────────────────────────
  const proId = await createProduct(
    "Ceremonia Pro",
    "Up to 5 weddings, custom theme builder, analytics, CSV export, custom domain",
  );
  const proMonthly = await createPrice(proId, 1900, "Pro Monthly", {
    interval: "month",
  });
  results["STRIPE_PRICE_PRO_MONTHLY"] = proMonthly.priceId;

  // ── AGENCY ───────────────────────────────────────────────────────────
  const agencyId = await createProduct(
    "Ceremonia Agency",
    "Unlimited weddings, white-label, theme marketplace, API access",
  );
  const agencyMonthly = await createPrice(agencyId, 7900, "Agency Monthly", {
    interval: "month",
  });
  results["STRIPE_PRICE_AGENCY_MONTHLY"] = agencyMonthly.priceId;

  // ── Write .env.local additions ────────────────────────────────────────
  const envLines = Object.entries(results)
    .map(([key, val]) => `${key}=${val}`)
    .join("\n");

  const envPath = path.resolve(process.cwd(), ".env.stripe.local");
  fs.writeFileSync(envPath, envLines + "\n");

  console.log("\n✦ Done! Price IDs written to .env.stripe.local\n");
  console.log("─────────────────────────────────────────────");
  console.log(envLines);
  console.log("─────────────────────────────────────────────");
  console.log("\nCopy these into your .env.local file.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
