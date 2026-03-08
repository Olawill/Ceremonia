ALTER TABLE "weddings" ADD COLUMN "wedding_party_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "wedding_party" jsonb;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "faq_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "faq" jsonb;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "livestream_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "livestream_url" text;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "livestream_title" text;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "livestream_note" text;