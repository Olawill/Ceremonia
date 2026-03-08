ALTER TABLE "weddings" ADD COLUMN "accommodation_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "accommodation" jsonb;