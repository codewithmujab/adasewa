CREATE TABLE "branch_item_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"rental_item_id" uuid NOT NULL,
	"price_per_day" integer DEFAULT 0 NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"city" varchar(80) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(40) NOT NULL,
	"whatsapp" varchar(64) NOT NULL,
	"delivery_fee_default" integer DEFAULT 50000 NOT NULL,
	"operating_hours" varchar(120) DEFAULT 'Senin – Minggu, 08.00 – 21.00 WIB' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code"),
	CONSTRAINT "branches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "branch_name" varchar(120);--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "branch_address" text;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN "branch_whatsapp" varchar(64);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "branch_item_stocks" ADD CONSTRAINT "branch_item_stocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_item_stocks" ADD CONSTRAINT "branch_item_stocks_rental_item_id_rental_items_id_fk" FOREIGN KEY ("rental_item_id") REFERENCES "public"."rental_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branch_item_stocks_branch_item_uidx" ON "branch_item_stocks" USING btree ("branch_id","rental_item_id");--> statement-breakpoint
CREATE INDEX "branch_item_stocks_branch_idx" ON "branch_item_stocks" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "branch_item_stocks_item_idx" ON "branch_item_stocks" USING btree ("rental_item_id");--> statement-breakpoint
CREATE INDEX "branches_active_order_idx" ON "branches" USING btree ("is_active","sort_order");--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_orders_branch_id_idx" ON "rental_orders" USING btree ("branch_id");