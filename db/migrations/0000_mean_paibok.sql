CREATE TYPE "public"."plan" AS ENUM('free', 'starter', 'pro', 'agency');--> statement-breakpoint
CREATE TABLE "custom_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"theme" jsonb NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"event_type" text DEFAULT 'event',
	"custom_domain" text,
	"user_id" text,
	"bride" text NOT NULL,
	"groom" text DEFAULT '',
	"date" date NOT NULL,
	"tag_line" text,
	"finale_tag_line" text,
	"venue_details" jsonb,
	"theme_key" text DEFAULT 'royal',
	"custom_theme" jsonb,
	"curtain_style" text DEFAULT 'velvet',
	"audio_url" text,
	"hero_photo_url" text,
	"timeline" jsonb,
	"menu_courses" jsonb,
	"rsvp_enabled" boolean DEFAULT true,
	"rsvp_deadline" date,
	"password_protected" boolean DEFAULT false,
	"password" text,
	"published" boolean DEFAULT false,
	"registry_enabled" boolean DEFAULT true,
	"guest_book_enabled" boolean DEFAULT false,
	"dress_code_enabled" boolean DEFAULT false,
	"dress_code" jsonb,
	"accommodation_enabled" boolean DEFAULT false,
	"accommodation" jsonb,
	"event_party_enabled" boolean DEFAULT false,
	"event_party" jsonb,
	"faq_enabled" boolean DEFAULT false,
	"faq" jsonb,
	"livestream_enabled" boolean DEFAULT false,
	"livestream_url" text,
	"livestream_title" text,
	"livestream_note" text,
	"photo_gallery_enabled" boolean DEFAULT false,
	"gallery_photos" jsonb,
	"travel_guide_enabled" boolean DEFAULT false,
	"travel_items" jsonb,
	"view_count" integer DEFAULT 0,
	"notification_email" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "guestbook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "registry_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"guest_name" text NOT NULL,
	"claim_token" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"purchased_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "registry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer,
	"currency" text DEFAULT 'USD',
	"image_url" text,
	"product_url" text,
	"retailer" text,
	"quantity" integer DEFAULT 1,
	"category" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"name" text NOT NULL,
	"attendance" text NOT NULL,
	"guests" integer DEFAULT 1,
	"dietary" text,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"polar_customer_id" text,
	"brand_name" text,
	"plan" "plan" DEFAULT 'free',
	"starter_is_once" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "custom_themes" ADD CONSTRAINT "custom_themes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook" ADD CONSTRAINT "guestbook_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_claims" ADD CONSTRAINT "registry_claims_item_id_registry_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."registry_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_claims" ADD CONSTRAINT "registry_claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_items" ADD CONSTRAINT "registry_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;