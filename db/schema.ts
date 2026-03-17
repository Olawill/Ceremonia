import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "starter", "pro", "agency"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  brandName: text("brand_name"),
  plan: planEnum("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weddings = pgTable("weddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  eventType: text("event_type").default("wedding"),
  customDomain: text("custom_domain").unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  bride: text("bride").notNull(),
  groom: text("groom").default(""),
  date: date("date").notNull(),
  tagLine: text("tag_line"),
  finaleTagLine: text("finale_tag_line"),
  venueDetails: jsonb("venue_details"), // VenueEvent[]
  themeKey: text("theme_key").default("royal"),
  customTheme: jsonb("custom_theme"),
  curtainStyle: text("curtain_style").default("velvet"),
  audioUrl: text("audio_url"),
  heroPhotoUrl: text("hero_photo_url"),
  timeline: jsonb("timeline"),
  menuCourses: jsonb("menu_courses"),
  rsvpEnabled: boolean("rsvp_enabled").default(true),
  rsvpDeadline: date("rsvp_deadline"),
  passwordProtected: boolean("password_protected").default(false),
  password: text("password"),
  published: boolean("published").default(false),
  registryEnabled: boolean("registry_enabled").default(true),
  guestBookEnabled: boolean("guest_book_enabled").default(false),

  // Dress Code
  dressCodeEnabled: boolean("dress_code_enabled").default(false),
  dressCode: jsonb("dress_code"),

  // Accommodation
  accommodationEnabled: boolean("accommodation_enabled").default(false),
  accommodation: jsonb("accommodation"),

  // Wedding Party
  weddingPartyEnabled: boolean("wedding_party_enabled").default(false),
  weddingParty: jsonb("wedding_party"),

  // FAQ
  faqEnabled: boolean("faq_enabled").default(false),
  faq: jsonb("faq"), // FaqItem[]

  // Livestream
  livestreamEnabled: boolean("livestream_enabled").default(false),
  livestreamUrl: text("livestream_url"), // YouTube/Vimeo embed URL
  livestreamTitle: text("livestream_title"), // e.g. "Watch Live"
  livestreamNote: text("livestream_note"), // e.g. "Stream starts 30 mins before ceremony"

  // Photo Gallery
  photoGalleryEnabled: boolean("photo_gallery_enabled").default(false),
  galleryPhotos: jsonb("gallery_photos"), // string[]

  // Travel Guide
  travelGuideEnabled: boolean("travel_guide_enabled").default(false),
  travelItems: jsonb("travel_items"), // TravelItem[]

  viewCount: integer("view_count").default(0),
  notificationEmail: text("notification_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rsvps = pgTable("rsvps", {
  id: uuid("id").defaultRandom().primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  attendance: text("attendance").notNull(),
  guests: integer("guests").default(1),
  dietary: text("dietary"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guestbook = pgTable("guestbook", {
  id: uuid("id").defaultRandom().primaryKey(),
  weddingId: uuid("wedding_id")
    .references(() => weddings.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customThemes = pgTable("custom_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  theme: jsonb("theme").notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registryItems = pgTable("registry_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price"), // in pence/cents, e.g. 4999 = £49.99
  currency: text("currency").default("USD"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"), // Amazon/John Lewis/etc link
  retailer: text("retailer"), // "Amazon", "John Lewis", etc.
  quantity: integer("quantity").default(1), // how many needed
  category: text("category"), // "Kitchen", "Travel", etc.
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registryClaims = pgTable("registry_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => registryItems.id, { onDelete: "cascade" }),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  // Guest identity — no auth, just a name + session token
  guestName: text("guest_name").notNull(),
  // A short random token stored in the guest's localStorage so they can "unclaim"
  // This is NOT a security token — it's just UX to let the same browser unclaim
  claimToken: text("claim_token").notNull(),
  // "reserved" = guest clicked "I'll buy this" | "purchased" = guest confirmed purchase
  status: text("status").notNull().default("reserved"), // "reserved" | "purchased"
  createdAt: timestamp("created_at").defaultNow(),
  purchasedAt: timestamp("purchased_at"),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  weddings: many(weddings),
  customThemes: many(customThemes),
}));

export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  owner: one(users, {
    fields: [weddings.userId],
    references: [users.id],
  }),
  rsvps: many(rsvps),
  registryItems: many(registryItems),
  registryClaims: many(registryClaims),
  guestbook: many(guestbook),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  wedding: one(weddings, {
    fields: [rsvps.weddingId],
    references: [weddings.id],
  }),
}));

export const customThemesRelations = relations(customThemes, ({ one }) => ({
  owner: one(users, {
    fields: [customThemes.userId],
    references: [users.id],
  }),
}));

export const registryItemsRelations = relations(
  registryItems,
  ({ one, many }) => ({
    wedding: one(weddings, {
      fields: [registryItems.weddingId],
      references: [weddings.id],
    }),
    claims: many(registryClaims),
  }),
);

export const registryClaimsRelations = relations(registryClaims, ({ one }) => ({
  item: one(registryItems, {
    fields: [registryClaims.itemId],
    references: [registryItems.id],
  }),
  wedding: one(weddings, {
    fields: [registryClaims.weddingId],
    references: [weddings.id],
  }),
}));

export const guestbookRelations = relations(guestbook, ({ one }) => ({
  wedding: one(weddings, {
    fields: [guestbook.weddingId],
    references: [weddings.id],
  }),
}));
