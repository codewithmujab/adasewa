CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"discount_type" varchar(20) DEFAULT 'percentage' NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_amount" integer,
	"min_order_amount" integer DEFAULT 0 NOT NULL,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_on_landing" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "promo_id" uuid;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "promo_code" varchar(40);--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "promo_discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "promo_codes_active_landing_idx" ON "promo_codes" USING btree ("is_active","show_on_landing");--> statement-breakpoint
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_promo_id_promo_codes_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;