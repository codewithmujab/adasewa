import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

// ============================================================================
// Tipe JSONB untuk kolom terstruktur CMS
// ============================================================================

export interface PortfolioMediaItem {
	imageKey: string;
	imageUrl: string;
	alt: string;
}

export interface CompanySocialLinks {
	instagram?: string;
	tiktok?: string;
	linkedin?: string;
	x?: string;
	youtube?: string;
	github?: string;
	whatsapp?: string;
	bookingForm?: string;
}

export interface RentalItemSpec {
	label: string;
	value: string;
}

// ============================================================================
// Tabel Cabang Penyewaan (Multi-Branch: Bogor, Depok, dll.)
// ============================================================================

export const branches = pgTable(
	'branches',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		code: varchar('code', { length: 16 }).notNull().unique(),
		name: varchar('name', { length: 120 }).notNull(),
		slug: varchar('slug', { length: 140 }).notNull().unique(),
		city: varchar('city', { length: 80 }).notNull(),
		address: text('address').notNull(),
		phone: varchar('phone', { length: 40 }).notNull(),
		whatsapp: varchar('whatsapp', { length: 64 }).notNull(),
		deliveryFeeDefault: integer('delivery_fee_default').notNull().default(50000),
		operatingHours: varchar('operating_hours', { length: 120 })
			.notNull()
			.default('Senin – Minggu, 08.00 – 21.00 WIB'),
		isActive: boolean('is_active').notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [index('branches_active_order_idx').on(table.isActive, table.sortOrder)]
);

// ============================================================================
// Tabel Autentikasi Better Auth (PostgreSQL)
// ============================================================================

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: text('role').notNull().default('customer'),
	branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
	pointBalance: integer('point_balance').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_user_id_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [index('account_user_id_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

// ============================================================================
// Tabel CMS Company Profile
// ============================================================================

export const services = pgTable(
	'services',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: varchar('title', { length: 160 }).notNull(),
		slug: varchar('slug', { length: 180 }).notNull().unique(),
		shortDescription: varchar('short_description', { length: 320 }).notNull(),
		description: text('description').notNull(),
		icon: varchar('icon', { length: 64 }),
		imageKey: text('image_key'),
		imageUrl: text('image_url'),
		isFeatured: boolean('is_featured').notNull().default(false),
		isPublished: boolean('is_published').notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('services_published_order_idx').on(table.isPublished, table.sortOrder),
		index('services_featured_idx').on(table.isFeatured)
	]
);

export const portfolios = pgTable(
	'portfolios',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: varchar('title', { length: 180 }).notNull(),
		slug: varchar('slug', { length: 200 }).notNull().unique(),
		clientName: varchar('client_name', { length: 160 }).notNull(),
		category: varchar('category', { length: 100 }).notNull(),
		summary: varchar('summary', { length: 360 }).notNull(),
		content: text('content').notNull(),
		projectUrl: text('project_url'),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		imageKey: text('image_key'),
		imageUrl: text('image_url'),
		gallery: jsonb('gallery').$type<PortfolioMediaItem[]>().notNull().default([]),
		serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
		isFeatured: boolean('is_featured').notNull().default(false),
		isPublished: boolean('is_published').notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('portfolios_service_id_idx').on(table.serviceId),
		index('portfolios_published_order_idx').on(table.isPublished, table.sortOrder),
		index('portfolios_featured_idx').on(table.isFeatured)
	]
);

export const companySettings = pgTable('company_settings', {
	id: varchar('id', { length: 32 }).primaryKey().default('default'),
	companyName: varchar('company_name', { length: 160 }).notNull(),
	tagline: varchar('tagline', { length: 240 }).notNull(),
	aboutShort: text('about_short').notNull(),
	aboutFull: text('about_full').notNull(),
	vision: text('vision'),
	mission: text('mission'),
	email: varchar('email', { length: 180 }).notNull(),
	phone: varchar('phone', { length: 64 }),
	address: text('address'),
	logoKey: text('logo_key'),
	logoUrl: text('logo_url'),
	imageKey: text('image_key'),
	imageUrl: text('image_url'),
	socialLinks: jsonb('social_links').$type<CompanySocialLinks>().notNull().default({}),
	metaTitle: varchar('meta_title', { length: 160 }),
	metaDescription: varchar('meta_description', { length: 320 }),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

// ============================================================================
// Tabel Katalog Penyewaan Barang (Adasewa.id)
// ============================================================================

export const rentalCategories = pgTable(
	'rental_categories',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 120 }).notNull(),
		slug: varchar('slug', { length: 140 }).notNull().unique(),
		description: text('description').notNull(),
		icon: varchar('icon', { length: 48 }).notNull().default('box'),
		accent: varchar('accent', { length: 32 }).notNull().default('slate'),
		sortOrder: integer('sort_order').notNull().default(0),
		isPublished: boolean('is_published').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('rental_categories_published_order_idx').on(table.isPublished, table.sortOrder)
	]
);

export const rentalItems = pgTable(
	'rental_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => rentalCategories.id, { onDelete: 'restrict' }),
		name: varchar('name', { length: 180 }).notNull(),
		slug: varchar('slug', { length: 200 }).notNull().unique(),
		shortDescription: varchar('short_description', { length: 320 }).notNull(),
		description: text('description').notNull(),
		specs: jsonb('specs').$type<RentalItemSpec[]>().notNull().default([]),
		includes: jsonb('includes').$type<string[]>().notNull().default([]),
		variants: jsonb('variants').$type<string[]>().notNull().default([]),
		pricePerDay: integer('price_per_day'),
		unitLabel: varchar('unit_label', { length: 40 }).notNull().default('hari'),
		minDurationDays: integer('min_duration_days').notNull().default(1),
		stockQty: integer('stock_qty').notNull().default(1),
		requiresDeposit: boolean('requires_deposit').notNull().default(false),
		deliveryAvailable: boolean('delivery_available').notNull().default(true),
		pickupAvailable: boolean('pickup_available').notNull().default(true),
		imageKey: text('image_key'),
		imageUrl: text('image_url'),
		gallery: jsonb('gallery').$type<PortfolioMediaItem[]>().notNull().default([]),
		isFeatured: boolean('is_featured').notNull().default(false),
		isPublished: boolean('is_published').notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('rental_items_category_id_idx').on(table.categoryId),
		index('rental_items_published_order_idx').on(table.isPublished, table.sortOrder),
		index('rental_items_featured_idx').on(table.isFeatured)
	]
);

export const branchItemStocks = pgTable(
	'branch_item_stocks',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		branchId: uuid('branch_id')
			.notNull()
			.references(() => branches.id, { onDelete: 'cascade' }),
		rentalItemId: uuid('rental_item_id')
			.notNull()
			.references(() => rentalItems.id, { onDelete: 'cascade' }),
		pricePerDay: integer('price_per_day').notNull().default(0),
		stockQty: integer('stock_qty').notNull().default(0),
		isAvailable: boolean('is_available').notNull().default(true),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		uniqueIndex('branch_item_stocks_branch_item_uidx').on(table.branchId, table.rentalItemId),
		index('branch_item_stocks_branch_idx').on(table.branchId),
		index('branch_item_stocks_item_idx').on(table.rentalItemId)
	]
);

// ============================================================================
// Tabel Promo & Voucher Diskon
// ============================================================================

export const promoCodes = pgTable(
	'promo_codes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
		code: varchar('code', { length: 40 }).notNull().unique(),
		title: varchar('title', { length: 140 }).notNull(),
		description: text('description').notNull(),
		discountType: varchar('discount_type', { length: 20 }).notNull().default('percentage'),
		discountValue: integer('discount_value').notNull(),
		maxDiscountAmount: integer('max_discount_amount'),
		minOrderAmount: integer('min_order_amount').notNull().default(0),
		usageLimit: integer('usage_limit'),
		usedCount: integer('used_count').notNull().default(0),
		startsAt: timestamp('starts_at', { withTimezone: true }),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		isActive: boolean('is_active').notNull().default(true),
		showOnLanding: boolean('show_on_landing').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('promo_codes_active_landing_idx').on(table.isActive, table.showOnLanding)
	]
);

// ============================================================================
// Tabel Transaksi Penyewaan & Pelacakan Pengembalian Barang
// ============================================================================

export const rentalOrders = pgTable(
	'rental_orders',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderCode: varchar('order_code', { length: 32 }).notNull().unique(),
		branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
		branchName: varchar('branch_name', { length: 120 }),
		branchAddress: text('branch_address'),
		branchWhatsapp: varchar('branch_whatsapp', { length: 64 }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),

		// Data pemesan & pengiriman
		customerName: varchar('customer_name', { length: 160 }).notNull(),
		customerEmail: varchar('customer_email', { length: 180 }).notNull(),
		customerPhone: varchar('customer_phone', { length: 40 }).notNull(),
		emergencyPhone: varchar('emergency_phone', { length: 40 }),
		deliveryMethod: varchar('delivery_method', { length: 24 }).notNull().default('delivery'),
		deliveryRegion: varchar('delivery_region', { length: 64 }),
		deliveryAddress: text('delivery_address'),
		infoSource: varchar('info_source', { length: 64 }),
		notes: text('notes'),

		// Jadwal sewa (YYYY-MM-DD)
		startDate: varchar('start_date', { length: 10 }).notNull(),
		endDate: varchar('end_date', { length: 10 }).notNull(),
		durationDays: integer('duration_days').notNull().default(1),

		// Rincian biaya (Rp), Promo Diskon & Poin Sewa
		subtotalAmount: integer('subtotal_amount').notNull().default(0),
		deliveryFee: integer('delivery_fee').notNull().default(0),
		depositAmount: integer('deposit_amount').notNull().default(0),
		lateFee: integer('late_fee').notNull().default(0),
		promoId: uuid('promo_id').references(() => promoCodes.id, { onDelete: 'set null' }),
		promoCode: varchar('promo_code', { length: 40 }),
		promoDiscountAmount: integer('promo_discount_amount').notNull().default(0),
		pointsRedeemed: integer('points_redeemed').notNull().default(0),
		pointsDiscountAmount: integer('points_discount_amount').notNull().default(0),
		pointsEarned: integer('points_earned').notNull().default(0),
		pointsAwardedAt: timestamp('points_awarded_at', { withTimezone: true }),
		totalAmount: integer('total_amount').notNull().default(0),

		// Pembayaran (siap integrasi Payment Gateway)
		paymentMethod: varchar('payment_method', { length: 40 }).notNull().default('bank_transfer'),
		paymentProvider: varchar('payment_provider', { length: 40 }).notNull().default('manual'),
		paymentReference: varchar('payment_reference', { length: 120 }),
		paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('unpaid'),
		paymentProofNote: text('payment_proof_note'),
		paidAt: timestamp('paid_at', { withTimezone: true }),

		// Siklus hidup sewa & pengembalian barang
		orderStatus: varchar('order_status', { length: 32 }).notNull().default('pending_payment'),
		returnMethod: varchar('return_method', { length: 24 }),
		returnRequestedAt: timestamp('return_requested_at', { withTimezone: true }),
		returnedAt: timestamp('returned_at', { withTimezone: true }),
		returnCondition: varchar('return_condition', { length: 32 }),
		returnNotes: text('return_notes'),

		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('rental_orders_branch_id_idx').on(table.branchId),
		index('rental_orders_user_id_idx').on(table.userId),
		index('rental_orders_status_idx').on(table.orderStatus),
		index('rental_orders_payment_status_idx').on(table.paymentStatus),
		index('rental_orders_dates_idx').on(table.startDate, table.endDate)
	]
);

export const rentalOrderItems = pgTable(
	'rental_order_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderId: uuid('order_id')
			.notNull()
			.references(() => rentalOrders.id, { onDelete: 'cascade' }),
		rentalItemId: uuid('rental_item_id').references(() => rentalItems.id, {
			onDelete: 'set null'
		}),
		itemName: varchar('item_name', { length: 180 }).notNull(),
		itemSlug: varchar('item_slug', { length: 200 }).notNull(),
		categoryName: varchar('category_name', { length: 120 }).notNull(),
		variant: varchar('variant', { length: 120 }),
		quantity: integer('quantity').notNull().default(1),
		unitPrice: integer('unit_price').notNull().default(0),
		unitLabel: varchar('unit_label', { length: 40 }).notNull().default('hari'),
		durationDays: integer('duration_days').notNull().default(1),
		lineTotal: integer('line_total').notNull().default(0),
		returnedQty: integer('returned_qty').notNull().default(0),
		returnCondition: varchar('return_condition', { length: 32 }).notNull().default('pending')
	},
	(table) => [
		index('rental_order_items_order_id_idx').on(table.orderId),
		index('rental_order_items_item_id_idx').on(table.rentalItemId)
	]
);

// ============================================================================
// Tabel Mutasi Rekening Poin Penyewa
// ============================================================================

export const pointTransactions = pgTable(
	'point_transactions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		orderId: uuid('order_id').references(() => rentalOrders.id, { onDelete: 'set null' }),
		orderCode: varchar('order_code', { length: 32 }),
		type: varchar('type', { length: 24 }).notNull(),
		points: integer('points').notNull(),
		balanceAfter: integer('balance_after').notNull(),
		description: varchar('description', { length: 280 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('point_transactions_user_created_idx').on(table.userId, table.createdAt),
		index('point_transactions_order_id_idx').on(table.orderId)
	]
);

// ============================================================================
// Relasi Drizzle ORM
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	orders: many(rentalOrders),
	pointTransactions: many(pointTransactions)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const servicesRelations = relations(services, ({ many }) => ({
	portfolios: many(portfolios)
}));

export const portfoliosRelations = relations(portfolios, ({ one }) => ({
	service: one(services, {
		fields: [portfolios.serviceId],
		references: [services.id]
	})
}));

export const rentalCategoriesRelations = relations(rentalCategories, ({ many }) => ({
	items: many(rentalItems)
}));

export const rentalItemsRelations = relations(rentalItems, ({ one }) => ({
	category: one(rentalCategories, {
		fields: [rentalItems.categoryId],
		references: [rentalCategories.id]
	})
}));

export const rentalOrdersRelations = relations(rentalOrders, ({ one, many }) => ({
	user: one(user, {
		fields: [rentalOrders.userId],
		references: [user.id]
	}),
	items: many(rentalOrderItems)
}));

export const rentalOrderItemsRelations = relations(rentalOrderItems, ({ one }) => ({
	order: one(rentalOrders, {
		fields: [rentalOrderItems.orderId],
		references: [rentalOrders.id]
	}),
	rentalItem: one(rentalItems, {
		fields: [rentalOrderItems.rentalItemId],
		references: [rentalItems.id]
	})
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
	user: one(user, {
		fields: [pointTransactions.userId],
		references: [user.id]
	}),
	order: one(rentalOrders, {
		fields: [pointTransactions.orderId],
		references: [rentalOrders.id]
	})
}));

// ============================================================================
// Tipe Inferred
// ============================================================================

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;

export type RentalCategory = typeof rentalCategories.$inferSelect;
export type NewRentalCategory = typeof rentalCategories.$inferInsert;

export type RentalItem = typeof rentalItems.$inferSelect;
export type NewRentalItem = typeof rentalItems.$inferInsert;

export type RentalOrder = typeof rentalOrders.$inferSelect;
export type NewRentalOrder = typeof rentalOrders.$inferInsert;

export type RentalOrderItem = typeof rentalOrderItems.$inferSelect;
export type NewRentalOrderItem = typeof rentalOrderItems.$inferInsert;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;

export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type BranchItemStock = typeof branchItemStocks.$inferSelect;
export type NewBranchItemStock = typeof branchItemStocks.$inferInsert;
