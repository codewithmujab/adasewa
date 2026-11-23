import { z } from 'zod';
import { SLUG_REGEX, mediaUrlSchema, slugify } from '#lib/schemas/common';

export { slugify };

export const serviceIdParamSchema = z
	.string()
	.uuid('Parameter ID layanan harus berupa UUID yang valid.');

export const serviceListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().trim().max(120).optional(),
	featured: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional(),
	includeUnpublished: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional()
});

export const createServiceSchema = z.object({
	title: z
		.string()
		.trim()
		.min(2, 'Judul layanan minimal 2 karakter.')
		.max(160, 'Judul layanan maksimal 160 karakter.'),
	slug: z
		.string()
		.trim()
		.min(2, 'Slug minimal 2 karakter.')
		.max(180, 'Slug maksimal 180 karakter.')
		.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
		.optional(),
	shortDescription: z
		.string()
		.trim()
		.min(10, 'Deskripsi singkat minimal 10 karakter.')
		.max(320, 'Deskripsi singkat maksimal 320 karakter.'),
	description: z
		.string()
		.trim()
		.min(20, 'Deskripsi lengkap minimal 20 karakter.')
		.max(20000, 'Deskripsi lengkap maksimal 20.000 karakter.'),
	icon: z.string().trim().max(64, 'Nama ikon maksimal 64 karakter.').nullable().optional(),
	imageKey: z.string().trim().max(512, 'Key gambar maksimal 512 karakter.').nullable().optional(),
	imageUrl: mediaUrlSchema.nullable().optional(),
	isFeatured: z.boolean().default(false),
	isPublished: z.boolean().default(true),
	sortOrder: z.number().int().min(0).max(9999).default(0)
});

export const updateServiceSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(2, 'Judul layanan minimal 2 karakter.')
			.max(160, 'Judul layanan maksimal 160 karakter.')
			.optional(),
		slug: z
			.string()
			.trim()
			.min(2, 'Slug minimal 2 karakter.')
			.max(180, 'Slug maksimal 180 karakter.')
			.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
			.optional(),
		shortDescription: z
			.string()
			.trim()
			.min(10, 'Deskripsi singkat minimal 10 karakter.')
			.max(320, 'Deskripsi singkat maksimal 320 karakter.')
			.optional(),
		description: z
			.string()
			.trim()
			.min(20, 'Deskripsi lengkap minimal 20 karakter.')
			.max(20000, 'Deskripsi lengkap maksimal 20.000 karakter.')
			.optional(),
		icon: z.string().trim().max(64, 'Nama ikon maksimal 64 karakter.').nullable().optional(),
		imageKey: z.string().trim().max(512, 'Key gambar maksimal 512 karakter.').nullable().optional(),
		imageUrl: mediaUrlSchema.nullable().optional(),
		isFeatured: z.boolean().optional(),
		isPublished: z.boolean().optional(),
		sortOrder: z.number().int().min(0).max(9999).optional()
	})
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui layanan.'
	});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
