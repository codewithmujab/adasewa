CREATE TABLE "rental_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"rental_item_id" uuid,
	"item_name" varchar(180) NOT NULL,
	"item_slug" varchar(200) NOT NULL,
	"category_name" varchar(120) NOT NULL,
	"variant" varchar(120),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"unit_label" varchar(40) DEFAULT 'hari' NOT NULL,
	"duration_days" integer DEFAULT 1 NOT NULL,
	"line_total" integer DEFAULT 0 NOT NULL,
	"returned_qty" integer DEFAULT 0 NOT NULL,
	"return_condition" varchar(32) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" varchar(32) NOT NULL,
	"user_id" text NOT NULL,
	"customer_name" varchar(160) NOT NULL,
	"customer_email" varchar(180) NOT NULL,
	"customer_phone" varchar(40) NOT NULL,
	"emergency_phone" varchar(40),
	"delivery_method" varchar(24) DEFAULT 'delivery' NOT NULL,
	"delivery_region" varchar(64),
	"delivery_address" text,
	"info_source" varchar(64),
	"notes" text,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"duration_days" integer DEFAULT 1 NOT NULL,
	"subtotal_amount" integer DEFAULT 0 NOT NULL,
	"delivery_fee" integer DEFAULT 0 NOT NULL,
	"deposit_amount" integer DEFAULT 0 NOT NULL,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"payment_method" varchar(40) DEFAULT 'bank_transfer' NOT NULL,
	"payment_provider" varchar(40) DEFAULT 'manual' NOT NULL,
	"payment_reference" varchar(120),
	"payment_status" varchar(32) DEFAULT 'unpaid' NOT NULL,
	"payment_proof_note" text,
	"paid_at" timestamp with time zone,
	"order_status" varchar(32) DEFAULT 'pending_payment' NOT NULL,
	"return_method" varchar(24),
	"return_requested_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"return_condition" varchar(32),
	"return_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_orders_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE "rental_order_items" ADD CONSTRAINT "rental_order_items_order_id_rental_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."rental_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_order_items" ADD CONSTRAINT "rental_order_items_rental_item_id_rental_items_id_fk" FOREIGN KEY ("rental_item_id") REFERENCES "public"."rental_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_order_items_order_id_idx" ON "rental_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "rental_order_items_item_id_idx" ON "rental_order_items" USING btree ("rental_item_id");--> statement-breakpoint
CREATE INDEX "rental_orders_user_id_idx" ON "rental_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rental_orders_status_idx" ON "rental_orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "rental_orders_payment_status_idx" ON "rental_orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "rental_orders_dates_idx" ON "rental_orders" USING btree ("start_date","end_date");