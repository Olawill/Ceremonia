ALTER TABLE "weddings" ADD COLUMN "dress_code_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "dress_code" jsonb;