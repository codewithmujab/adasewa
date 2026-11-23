import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
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
	linkedin?: string;
	x?: string;
	youtube?: string;
	github?: string;
	whatsapp?: string;
}

// ============================================================================
// Tabel Autentikasi Better Auth (PostgreSQL)
// ============================================================================

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: text('role').notNull().default('admin'),
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
// Relasi Drizzle ORM
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
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

// ============================================================================
// Tipe Inferred
// ============================================================================

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;
