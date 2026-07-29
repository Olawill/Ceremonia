ALTER TABLE "events" ADD COLUMN "cash_gift_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cash_gift" jsonb;