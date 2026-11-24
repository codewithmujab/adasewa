import { z } from 'zod';
import { SLUG_REGEX, slugify, uuidSchema } from '#lib/schemas/common';

export { slugify };

export const branchIdParamSchema = uuidSchema;

export const createBranchSchema = z.object({
	code: z
		.string()
		.trim()
		.min(2, 'Kode cabang minimal 2 karakter.')
		.max(16, 'Kode cabang maksimal 16 karakter.')
		.transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
	name: z.string().trim().min(2, 'Nama cabang minimal 2 karakter.').max(120),
	slug: z
		.string()
		.trim()
		.min(2)
		.max(140)
		.regex(SLUG_REGEX, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.')
		.optional(),
	city: z.string().trim().min(2, 'Nama kota wajib diisi.').max(80),
	address: z.string().trim().min(8, 'Alamat kios lengkap minimal 8 karakter.').max(1000),
	phone: z.string().trim().min(8, 'Nomor telepon minimal 8 digit.').max(40),
	whatsapp: z
		.string()
		.trim()
		.min(9, 'Nomor WhatsApp minimal 9 digit (contoh: 62857xxxx).')
		.max(64)
		.transform((v) => {
			const digits = v.replace(/\D/g, '');
			return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
		}),
	deliveryFeeDefault: z.number().int().min(0).max(10_000_000).default(50000),
	operatingHours: z.string().trim().min(3).max(120).default('Senin – Minggu, 08.00 – 21.00 WIB'),
	isActive: z.boolean().default(true),
	sortOrder: z.number().int().min(0).max(999).default(0)
});

export const updateBranchSchema = z
	.object({
		code: z
			.string()
			.trim()
			.min(2)
			.max(16)
			.transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''))
			.optional(),
		name: z.string().trim().min(2).max(120).optional(),
		city: z.string().trim().min(2).max(80).optional(),
		address: z.string().trim().min(8).max(1000).optional(),
		phone: z.string().trim().min(8).max(40).optional(),
		whatsapp: z
			.string()
			.trim()
			.min(9)
			.max(64)
			.transform((v) => {
				const digits = v.replace(/\D/g, '');
				return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
			})
			.optional(),
		deliveryFeeDefault: z.number().int().min(0).max(10_000_000).optional(),
		operatingHours: z.string().trim().min(3).max(120).optional(),
		isActive: z.boolean().optional(),
		sortOrder: z.number().int().min(0).max(999).optional()
	})
	.refine((data) => Object.values(data).some((v) => v !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui cabang.'
	});

export const upsertBranchStockSchema = z.object({
	branchId: uuidSchema,
	pricePerDay: z.number().int().min(0).max(1_000_000_000),
	stockQty: z.number().int().min(0).max(10000),
	isAvailable: z.boolean().default(true)
});
