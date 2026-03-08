CREATE TABLE "guestbook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "weddings" ADD COLUMN "guest_book_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guestbook" ADD CONSTRAINT "guestbook_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;