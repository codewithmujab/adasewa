import { z } from 'zod';
import { SLUG_REGEX, mediaUrlSchema, slugify, uuidSchema } from '#lib/schemas/common';

export { slugify };

export const rentalItemIdParamSchema = uuidSchema;

export const rentalItemSpecSchema = z.object({
	label: z.string().trim().min(1, 'Label spesifikasi wajib diisi.').max(80),
	value: z.string().trim().min(1, 'Nilai spesifikasi wajib diisi.').max(240)
});

export const catalogListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(200).default(50),
	search: z.string().trim().max(120).optional(),
	category: z.string().trim().max(140).optional(),
	featured: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional(),
	includeUnpublished: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional()
});

const nullablePriceSchema = z
	.union([z.number().int().min(0).max(1_000_000_000), z.null()])
	.optional();

export const createRentalItemSchema = z.object({
	categoryId: uuidSchema,
	name: z
		.string()
		.trim()
		.min(2, 'Nama barang minimal 2 karakter.')
		.max(180, 'Nama barang maksimal 180 karakter.'),
	slug: z
		.string()
		.trim()
		.min(2, 'Slug minimal 2 karakter.')
		.max(200, 'Slug maksimal 200 karakter.')
		.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
		.optional(),
	shortDescription: z
		.string()
		.trim()
		.min(8, 'Deskripsi singkat minimal 8 karakter.')
		.max(320, 'Deskripsi singkat maksimal 320 karakter.'),
	description: z
		.string()
		.trim()
		.min(10, 'Deskripsi lengkap minimal 10 karakter.')
		.max(20000, 'Deskripsi lengkap maksimal 20.000 karakter.'),
	specs: z.array(rentalItemSpecSchema).max(20).default([]),
	includes: z.array(z.string().trim().min(1).max(160)).max(25).default([]),
	variants: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
	pricePerDay: nullablePriceSchema,
	unitLabel: z.string().trim().min(1).max(40).default('hari'),
	minDurationDays: z.number().int().min(1).max(365).default(1),
	stockQty: z.number().int().min(0).max(10000).default(1),
	requiresDeposit: z.boolean().default(false),
	deliveryAvailable: z.boolean().default(true),
	pickupAvailable: z.boolean().default(true),
	imageKey: z.string().trim().max(512).nullable().optional(),
	imageUrl: mediaUrlSchema.nullable().optional(),
	isFeatured: z.boolean().default(false),
	isPublished: z.boolean().default(true),
	sortOrder: z.number().int().min(0).max(9999).default(0)
});

export const updateRentalItemSchema = z
	.object({
		categoryId: uuidSchema.optional(),
		name: z.string().trim().min(2).max(180).optional(),
		slug: z
			.string()
			.trim()
			.min(2)
			.max(200)
			.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
			.optional(),
		shortDescription: z.string().trim().min(8).max(320).optional(),
		description: z.string().trim().min(10).max(20000).optional(),
		specs: z.array(rentalItemSpecSchema).max(20).optional(),
		includes: z.array(z.string().trim().min(1).max(160)).max(25).optional(),
		variants: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
		pricePerDay: nullablePriceSchema,
		unitLabel: z.string().trim().min(1).max(40).optional(),
		minDurationDays: z.number().int().min(1).max(365).optional(),
		stockQty: z.number().int().min(0).max(10000).optional(),
		requiresDeposit: z.boolean().optional(),
		deliveryAvailable: z.boolean().optional(),
		pickupAvailable: z.boolean().optional(),
		imageKey: z.string().trim().max(512).nullable().optional(),
		imageUrl: mediaUrlSchema.nullable().optional(),
		isFeatured: z.boolean().optional(),
		isPublished: z.boolean().optional(),
		sortOrder: z.number().int().min(0).max(9999).optional()
	})
	.refine((data) => Object.values(data).some((val) => val !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui barang.'
	});

export type CreateRentalItemInput = z.infer<typeof createRentalItemSchema>;
export type UpdateRentalItemInput = z.infer<typeof updateRentalItemSchema>;
