CREATE TABLE "rental_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(48) DEFAULT 'box' NOT NULL,
	"accent" varchar(32) DEFAULT 'slate' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rental_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"short_description" varchar(320) NOT NULL,
	"description" text NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_per_day" integer,
	"unit_label" varchar(40) DEFAULT 'hari' NOT NULL,
	"min_duration_days" integer DEFAULT 1 NOT NULL,
	"stock_qty" integer DEFAULT 1 NOT NULL,
	"requires_deposit" boolean DEFAULT false NOT NULL,
	"delivery_available" boolean DEFAULT true NOT NULL,
	"pickup_available" boolean DEFAULT true NOT NULL,
	"image_key" text,
	"image_url" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_category_id_rental_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."rental_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_categories_published_order_idx" ON "rental_categories" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "rental_items_category_id_idx" ON "rental_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "rental_items_published_order_idx" ON "rental_items" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "rental_items_featured_idx" ON "rental_items" USING btree ("is_featured");