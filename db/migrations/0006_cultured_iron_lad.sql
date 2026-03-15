ALTER TABLE "weddings" ADD COLUMN "photo_gallery_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "gallery_photos" jsonb;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "travel_guide_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "travel_items" jsonb;