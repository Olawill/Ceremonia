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
  polarCustomerId: text("polar_customer_id").unique(),
  brandName: text("brand_name"),
  plan: planEnum("plan").default("free"),
  starterIsOnce: boolean("starter_is_once").default(false),
  // Monthly event creation quota
  monthlyEventsCreated: integer("monthly_events_created").default(0),
  eventPeriodStart: timestamp("event_period_start").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  eventType: text("event_type").default("event"),
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
  entryStyle: text("entry_style").default("curtain"),
  navMode: text("nav_mode").default("scroll"),
  featureMode: text("feature_mode").default("castle"),
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

  // event Party
  eventPartyEnabled: boolean("event_party_enabled").default(false),
  eventParty: jsonb("event_party"),

  // FAQ
  faqEnabled: boolean("faq_enabled").default(false),
  faq: jsonb("faq"), // FaqItem[]

  // Livestream
  livestreamEnabled: boolean("livestream_enabled").default(false),
  livestreamUrl: text("livestream_url"), // YouTube/Vimeo embed URL
  livestreamTitle: text("livestream_title"), // e.g. "Watch Live"
  livestreamNote: text("livestream_note"), // e.g. "Stream starts 30 mins before ceremony"
  livestreamTime: text("livestream_time"), // e.g. "Stream starts at"

  // Photo Gallery
  photoGalleryEnabled: boolean("photo_gallery_enabled").default(false),
  galleryPhotos: jsonb("gallery_photos"), // string[]

  // Travel Guide
  travelGuideEnabled: boolean("travel_guide_enabled").default(false),
  travelItems: jsonb("travel_items"), // TravelItem[]

  // Monetary/cash gifts — payment-app handles only, never raw bank details
  cashGiftEnabled: boolean("cash_gift_enabled").default(false),
  cashGift: jsonb("cash_gift"), // CashGiftConfig

  viewCount: integer("view_count").default(0),
  notificationEmail: text("notification_email"),
  expiresAt: timestamp("expires_at"),
  // Set once the "your event expires soon" email has gone out, so the daily
  // reminder cron doesn't re-send it every day for the whole 7-day window.
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const rsvps = pgTable("rsvps", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, {
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
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
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
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
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
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
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

export const roomsCredits = pgTable("rooms_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(), // one row per user
  // Monthly free allowance (Agency only, resets each period, does NOT roll over)
  freeCreditsTotal: integer("free_credits_total").notNull().default(0),
  freeCreditsUsed: integer("free_credits_used").notNull().default(0),
  periodStart: timestamp("period_start").defaultNow(), // when the current month started
  // Purchased credits (permanent, roll over forever)
  purchasedCreditsTotal: integer("purchased_credits_total")
    .notNull()
    .default(0),
  purchasedCreditsUsed: integer("purchased_credits_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Idempotency guard for Polar webhooks — Polar retries deliveries on timeout
// or non-2xx, so a handler that grants credits or mutates state must record
// that it already processed a given event id before acting on it again.
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  // Polar's event/resource id for the delivery, e.g. the order id for
  // order.created — unique per logical event, so a duplicate delivery
  // collides on insert and the handler can skip re-processing it.
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
});

// Fixed-window rate limiting for public, unauthenticated endpoints (RSVP,
// guestbook, registry claims, password unlock) — keyed by e.g. "rsvp:1.2.3.4".
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  customThemes: many(customThemes),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  owner: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  rsvps: many(rsvps),
  registryItems: many(registryItems),
  registryClaims: many(registryClaims),
  guestbook: many(guestbook),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  event: one(events, {
    fields: [rsvps.eventId],
    references: [events.id],
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
    event: one(events, {
      fields: [registryItems.eventId],
      references: [events.id],
    }),
    claims: many(registryClaims),
  }),
);

export const registryClaimsRelations = relations(registryClaims, ({ one }) => ({
  item: one(registryItems, {
    fields: [registryClaims.itemId],
    references: [registryItems.id],
  }),
  event: one(events, {
    fields: [registryClaims.eventId],
    references: [events.id],
  }),
}));

export const guestbookRelations = relations(guestbook, ({ one }) => ({
  event: one(events, {
    fields: [guestbook.eventId],
    references: [events.id],
  }),
}));

export const roomsCreditsRelations = relations(roomsCredits, ({ one }) => ({
  user: one(users, { fields: [roomsCredits.userId], references: [users.id] }),
}));
