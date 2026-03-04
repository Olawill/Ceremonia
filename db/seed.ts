// import { DEMO_WEDDING_CONFIG } from "@/types/wedding";
// import { db } from "./index";
// import { weddings } from "./schema";

// async function main() {
//   console.log("🌱 Seeding database...");

//   await db
//     .insert(weddings)
//     .values({
//       slug: "demo",
//       userId: null,
//       bride: DEMO_WEDDING_CONFIG.bride,
//       groom: DEMO_WEDDING_CONFIG.groom,
//       tagLine: DEMO_WEDDING_CONFIG.tagLine,
//       date: DEMO_WEDDING_CONFIG.date,
//       venueDetails: DEMO_WEDDING_CONFIG.venueDetails,
//       themeKey: DEMO_WEDDING_CONFIG.themeKey,
//       curtainStyle: DEMO_WEDDING_CONFIG.curtainStyle,
//       timeline: DEMO_WEDDING_CONFIG.timeline,
//       menuCourses: DEMO_WEDDING_CONFIG.menuCourses,
//       rsvpEnabled: true,
//       published: true,
//     })
//     .onConflictDoNothing();

//   console.log("✅ Seed complete");
//   process.exit(0);
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

import { DEMO_WEDDING_CONFIG } from "@/types/wedding";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { registryItems, weddings } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  await db
    .insert(weddings)
    .values({
      slug: "demo",
      userId: null,
      bride: DEMO_WEDDING_CONFIG.bride,
      groom: DEMO_WEDDING_CONFIG.groom,
      tagLine: DEMO_WEDDING_CONFIG.tagLine,
      finaleTagLine: DEMO_WEDDING_CONFIG.finaleTagLine,
      date: DEMO_WEDDING_CONFIG.date,
      venueDetails: DEMO_WEDDING_CONFIG.venueDetails,
      themeKey: DEMO_WEDDING_CONFIG.themeKey,
      curtainStyle: DEMO_WEDDING_CONFIG.curtainStyle,
      timeline: DEMO_WEDDING_CONFIG.timeline,
      menuCourses: DEMO_WEDDING_CONFIG.menuCourses,
      rsvpEnabled: DEMO_WEDDING_CONFIG.rsvpEnabled,
      passwordProtected: DEMO_WEDDING_CONFIG.passwordProtected,
      published: true,
    })
    .onConflictDoNothing();

  // Fetch the demo wedding id for registry items
  const [demoWedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.slug, "demo"))
    .limit(1);

  if (demoWedding) {
    await db
      .insert(registryItems)
      .values([
        {
          weddingId: demoWedding.id,
          title: "KitchenAid Stand Mixer",
          description: "5qt tilt-head model in Empire Red",
          price: 44999,
          retailer: "John Lewis",
          productUrl: "https://www.johnlewis.com",
          category: "Kitchen",
          quantity: 1,
          sortOrder: 1,
        },
        {
          weddingId: demoWedding.id,
          title: "Le Creuset Casserole Dish",
          description: "28cm round casserole in Volcanic",
          price: 27500,
          retailer: "John Lewis",
          productUrl: "https://www.johnlewis.com",
          category: "Kitchen",
          quantity: 1,
          sortOrder: 2,
        },
        {
          weddingId: demoWedding.id,
          title: "Honeymoon Fund",
          description:
            "Help us celebrate our first adventure together in Tuscany",
          price: 5000,
          retailer: "Other",
          category: "Experience",
          quantity: 20,
          sortOrder: 3,
        },
        {
          weddingId: demoWedding.id,
          title: "Linen Bedding Set",
          description: "King size natural linen duvet cover and pillowcases",
          price: 18999,
          retailer: "Anthropologie",
          productUrl: "https://www.anthropologie.com",
          category: "Bedroom",
          quantity: 1,
          sortOrder: 4,
        },
      ])
      .onConflictDoNothing();
  }

  console.log("✅ Seed complete");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
