ALTER TABLE "events" ADD COLUMN "feature_mode" text DEFAULT 'castle';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_events_created" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "event_period_start" timestamp DEFAULT now();