import { DEMO_WEDDING_CONFIG } from "@/types/wedding";
import { db } from "./index";
import { weddings } from "./schema";

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
      date: DEMO_WEDDING_CONFIG.date,
      venueDetails: DEMO_WEDDING_CONFIG.venueDetails,
      themeKey: DEMO_WEDDING_CONFIG.themeKey,
      curtainStyle: DEMO_WEDDING_CONFIG.curtainStyle,
      timeline: DEMO_WEDDING_CONFIG.timeline,
      menuCourses: DEMO_WEDDING_CONFIG.menuCourses,
      rsvpEnabled: true,
      published: true,
    })
    .onConflictDoNothing();

  console.log("✅ Seed complete");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
