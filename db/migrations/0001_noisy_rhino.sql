ALTER TABLE "rsvps" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "entry_style" text DEFAULT 'curtain';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "nav_mode" text DEFAULT 'scroll';--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_polar_customer_id_unique" UNIQUE("polar_customer_id");