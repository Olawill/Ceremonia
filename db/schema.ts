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
  plan: planEnum("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weddings = pgTable("weddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  userId: text("user_id").references(() => users.id),
  bride: text("bride").notNull(),
  groom: text("groom").notNull(),
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
  viewCount: integer("view_count").default(0),
  notificationEmail: text("notification_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rsvps = pgTable("rsvps", {
  id: uuid("id").defaultRandom().primaryKey(),
  weddingId: uuid("wedding_id").references(() => weddings.id),
  name: text("name").notNull(),
  attendance: text("attendance").notNull(),
  guests: integer("guests").default(1),
  dietary: text("dietary"),
  message: text("message"),
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
