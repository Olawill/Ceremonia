ALTER TABLE "rooms_credits" RENAME COLUMN "credits_total" TO "free_credits_total";--> statement-breakpoint
ALTER TABLE "rooms_credits" RENAME COLUMN "credits_used" TO "free_credits_used";--> statement-breakpoint
ALTER TABLE "rooms_credits" ADD COLUMN "purchased_credits_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms_credits" ADD COLUMN "purchased_credits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms_credits" ADD CONSTRAINT "rooms_credits_user_id_unique" UNIQUE("user_id");