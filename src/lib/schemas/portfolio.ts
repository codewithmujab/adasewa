import { z } from 'zod';
import { SLUG_REGEX, httpUrlSchema, mediaUrlSchema, slugify } from '#lib/schemas/common';

export { slugify };

export const portfolioIdParamSchema = z
	.string()
	.uuid('Parameter ID portofolio harus berupa UUID yang valid.');

export const portfolioMediaItemSchema = z.object({
	imageKey: z.string().trim().min(1, 'Key gambar galeri wajib diisi.').max(512),
	imageUrl: mediaUrlSchema,
	alt: z.string().trim().max(240, 'Teks alt maksimal 240 karakter.').default('')
});

const optionalDateSchema = z
	.union([z.string().trim(), z.null()])
	.optional()
	.transform((val, ctx) => {
		if (val === undefined) return undefined;
		if (val === null || val === '') return null;
		const parsed = new Date(val);
		if (Number.isNaN(parsed.getTime())) {
			ctx.addIssue({
				code: 'custom',
				message: 'Format tanggal selesai tidak valid.'
			});
			return z.NEVER;
		}
		return parsed;
	});

const optionalProjectUrlSchema = z
	.union([httpUrlSchema, z.literal(''), z.null()])
	.optional()
	.transform((val) => {
		if (val === undefined) return undefined;
		if (val === null || val === '') return null;
		return val;
	});

const optionalServiceIdSchema = z
	.union([z.string().uuid('ID layanan tidak valid.'), z.literal(''), z.null()])
	.optional()
	.transform((val) => {
		if (val === undefined) return undefined;
		if (val === null || val === '') return null;
		return val;
	});

export const portfolioListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().trim().max(120).optional(),
	category: z.string().trim().max(100).optional(),
	serviceId: z.string().uuid('Filter serviceId harus berupa UUID valid.').optional(),
	featured: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional(),
	includeUnpublished: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional()
});

export const createPortfolioSchema = z.object({
	title: z
		.string()
		.trim()
		.min(2, 'Judul portofolio minimal 2 karakter.')
		.max(180, 'Judul portofolio maksimal 180 karakter.'),
	slug: z
		.string()
		.trim()
		.min(2, 'Slug minimal 2 karakter.')
		.max(200, 'Slug maksimal 200 karakter.')
		.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
		.optional(),
	clientName: z
		.string()
		.trim()
		.min(2, 'Nama klien minimal 2 karakter.')
		.max(160, 'Nama klien maksimal 160 karakter.'),
	category: z
		.string()
		.trim()
		.min(2, 'Kategori minimal 2 karakter.')
		.max(100, 'Kategori maksimal 100 karakter.'),
	summary: z
		.string()
		.trim()
		.min(10, 'Ringkasan minimal 10 karakter.')
		.max(360, 'Ringkasan maksimal 360 karakter.'),
	content: z
		.string()
		.trim()
		.min(20, 'Konten studi kasus minimal 20 karakter.')
		.max(30000, 'Konten maksimal 30.000 karakter.'),
	projectUrl: optionalProjectUrlSchema,
	completedAt: optionalDateSchema,
	imageKey: z.string().trim().max(512).nullable().optional(),
	imageUrl: mediaUrlSchema.nullable().optional(),
	gallery: z.array(portfolioMediaItemSchema).max(20, 'Galeri maksimal 20 gambar.').default([]),
	serviceId: optionalServiceIdSchema,
	isFeatured: z.boolean().default(false),
	isPublished: z.boolean().default(true),
	sortOrder: z.number().int().min(0).max(9999).default(0)
});

export const updatePortfolioSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(2, 'Judul portofolio minimal 2 karakter.')
			.max(180, 'Judul portofolio maksimal 180 karakter.')
			.optional(),
		slug: z
			.string()
			.trim()
			.min(2, 'Slug minimal 2 karakter.')
			.max(200, 'Slug maksimal 200 karakter.')
			.regex(SLUG_REGEX, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).')
			.optional(),
		clientName: z
			.string()
			.trim()
			.min(2, 'Nama klien minimal 2 karakter.')
			.max(160, 'Nama klien maksimal 160 karakter.')
			.optional(),
		category: z
			.string()
			.trim()
			.min(2, 'Kategori minimal 2 karakter.')
			.max(100, 'Kategori maksimal 100 karakter.')
			.optional(),
		summary: z
			.string()
			.trim()
			.min(10, 'Ringkasan minimal 10 karakter.')
			.max(360, 'Ringkasan maksimal 360 karakter.')
			.optional(),
		content: z
			.string()
			.trim()
			.min(20, 'Konten studi kasus minimal 20 karakter.')
			.max(30000, 'Konten maksimal 30.000 karakter.')
			.optional(),
		projectUrl: optionalProjectUrlSchema,
		completedAt: optionalDateSchema,
		imageKey: z.string().trim().max(512).nullable().optional(),
		imageUrl: mediaUrlSchema.nullable().optional(),
		gallery: z.array(portfolioMediaItemSchema).max(20, 'Galeri maksimal 20 gambar.').optional(),
		serviceId: optionalServiceIdSchema,
		isFeatured: z.boolean().optional(),
		isPublished: z.boolean().optional(),
		sortOrder: z.number().int().min(0).max(9999).optional()
	})
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui portofolio.'
	});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
