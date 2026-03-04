DO $$ BEGIN
  CREATE TYPE "public"."plan" AS ENUM('free', 'starter', 'pro', 'agency');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "custom_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"theme" jsonb NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registry_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"wedding_id" uuid NOT NULL,
	"guest_name" text NOT NULL,
	"claim_token" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"purchased_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer,
	"image_url" text,
	"product_url" text,
	"retailer" text,
	"quantity" integer DEFAULT 1,
	"category" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid,
	"name" text NOT NULL,
	"attendance" text NOT NULL,
	"guests" integer DEFAULT 1,
	"dietary" text,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"brand_name" text,
	"plan" "plan" DEFAULT 'free',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"user_id" text,
	"bride" text NOT NULL,
	"groom" text NOT NULL,
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
	"view_count" integer DEFAULT 0,
	"notification_email" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "weddings_slug_unique" UNIQUE("slug"),
	CONSTRAINT "weddings_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_themes" ADD CONSTRAINT "custom_themes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "registry_claims" ADD CONSTRAINT "registry_claims_item_id_registry_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."registry_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "registry_claims" ADD CONSTRAINT "registry_claims_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "registry_items" ADD CONSTRAINT "registry_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "weddings" ADD CONSTRAINT "weddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;