// import { DEMO_EVENT_CONFIG } from "@/types/wedding";
// import { db } from "./index";
// import { weddings } from "./schema";

// async function main() {
//   console.log("🌱 Seeding database...");

//   await db
//     .insert(weddings)
//     .values({
//       slug: "demo",
//       userId: null,
//       bride: DEMO_EVENT_CONFIG.bride,
//       groom: DEMO_EVENT_CONFIG.groom,
//       tagLine: DEMO_EVENT_CONFIG.tagLine,
//       date: DEMO_EVENT_CONFIG.date,
//       venueDetails: DEMO_EVENT_CONFIG.venueDetails,
//       themeKey: DEMO_EVENT_CONFIG.themeKey,
//       curtainStyle: DEMO_EVENT_CONFIG.curtainStyle,
//       timeline: DEMO_EVENT_CONFIG.timeline,
//       menuCourses: DEMO_EVENT_CONFIG.menuCourses,
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

import { hashPassword } from "@/lib/password";
import { DEMO_EVENT_CONFIG } from "@/types/event";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { events, registryItems } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  await db
    .insert(events)
    .values({
      slug: "demo",
      eventType: "wedding",
      userId: null,
      bride: DEMO_EVENT_CONFIG.bride,
      groom: DEMO_EVENT_CONFIG.groom,
      tagLine: DEMO_EVENT_CONFIG.tagLine,
      finaleTagLine: DEMO_EVENT_CONFIG.finaleTagLine,
      date: DEMO_EVENT_CONFIG.date,
      venueDetails: DEMO_EVENT_CONFIG.venueDetails,
      themeKey: DEMO_EVENT_CONFIG.themeKey,
      curtainStyle: DEMO_EVENT_CONFIG.curtainStyle,
      timeline: DEMO_EVENT_CONFIG.timeline,
      menuCourses: DEMO_EVENT_CONFIG.menuCourses,
      rsvpEnabled: DEMO_EVENT_CONFIG.rsvpEnabled,
      passwordProtected: DEMO_EVENT_CONFIG.passwordProtected,
      published: true,
    })
    .onConflictDoNothing();

  // Fetch the demo wedding id for registry items
  const [demoWedding] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, "demo"))
    .limit(1);

  if (demoWedding) {
    await db
      .insert(registryItems)
      .values([
        {
          eventId: demoWedding.id,
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
          eventId: demoWedding.id,
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
          eventId: demoWedding.id,
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
          eventId: demoWedding.id,
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

  // Seed a password-protected wedding for E2E tests
  await db
    .insert(events)
    .values({
      slug: "test-protected",
      userId: null,
      bride: "Isabella",
      groom: "Alexander",
      date: "2026-09-20",
      venueDetails: [
        { label: "Ceremony", value: "3:00 PM", sub: "The Chapel" },
        { label: "Reception", value: "6:00 PM", sub: "The Grand Hall" },
        { label: "Location", value: "Ashford Manor", sub: "Oxfordshire, UK" },
      ],
      themeKey: "royal",
      curtainStyle: "velvet",
      timeline: [],
      menuCourses: [],
      rsvpEnabled: false,
      passwordProtected: true,
      password: hashPassword("ceremony2026"),
      published: true,
    })
    .onConflictDoNothing();

  console.log("✅ test-protected wedding seeded");

  console.log("✅ Seed complete");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
