import { z } from 'zod';
import { uuidSchema } from '#lib/schemas/common';
import { normalizePromoCode } from '#lib/utils/promo';

export const promoIdParamSchema = uuidSchema;

const promoCodeStringSchema = z
	.string()
	.trim()
	.min(3, 'Kode promo minimal 3 karakter.')
	.max(40, 'Kode promo maksimal 40 karakter.')
	.transform((val) => normalizePromoCode(val))
	.refine((val) => /^[A-Z0-9_-]{3,40}$/.test(val), {
		message: 'Kode promo hanya boleh berisi huruf, angka, garis bawah (_), atau tanda hubung (-).'
	});

const nullableIsoDateSchema = z
	.union([z.string().trim(), z.null(), z.undefined()])
	.transform((val) => {
		if (!val) return null;
		const parsed = new Date(val);
		return Number.isNaN(parsed.getTime()) ? 'INVALID' : parsed;
	})
	.refine((val) => val !== 'INVALID', { message: 'Format tanggal tidak valid.' });

export const validatePromoSchema = z.object({
	code: z.string().trim().min(1, 'Masukkan kode promo terlebih dahulu.').max(40),
	subtotalAmount: z.number().int().min(0),
	branchId: uuidSchema.nullable().optional()
});

export const createPromoSchema = z
	.object({
		branchId: uuidSchema.nullable().optional(),
		code: promoCodeStringSchema,
		title: z.string().trim().min(3, 'Judul promo minimal 3 karakter.').max(140),
		description: z.string().trim().min(5, 'Deskripsi promo minimal 5 karakter.').max(1000),
		discountType: z.enum(['percentage', 'fixed']),
		discountValue: z.number().int().min(1, 'Nilai diskon minimal 1.'),
		maxDiscountAmount: z.number().int().min(1000).max(100_000_000).nullable().optional(),
		minOrderAmount: z.number().int().min(0).max(100_000_000).default(0),
		usageLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
		startsAt: nullableIsoDateSchema.optional(),
		expiresAt: nullableIsoDateSchema.optional(),
		isActive: z.boolean().default(true),
		showOnLanding: z.boolean().default(true)
	})
	.superRefine((data, ctx) => {
		if (data.discountType === 'percentage' && data.discountValue > 90) {
			ctx.addIssue({
				code: 'custom',
				path: ['discountValue'],
				message: 'Diskon persentase maksimal 90%.'
			});
		}
		if (data.startsAt instanceof Date && data.expiresAt instanceof Date && data.expiresAt < data.startsAt) {
			ctx.addIssue({
				code: 'custom',
				path: ['expiresAt'],
				message: 'Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.'
			});
		}
	});

export const updatePromoSchema = z
	.object({
		branchId: uuidSchema.nullable().optional(),
		code: promoCodeStringSchema.optional(),
		title: z.string().trim().min(3).max(140).optional(),
		description: z.string().trim().min(5).max(1000).optional(),
		discountType: z.enum(['percentage', 'fixed']).optional(),
		discountValue: z.number().int().min(1).optional(),
		maxDiscountAmount: z.number().int().min(1000).max(100_000_000).nullable().optional(),
		minOrderAmount: z.number().int().min(0).max(100_000_000).optional(),
		usageLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
		startsAt: nullableIsoDateSchema.optional(),
		expiresAt: nullableIsoDateSchema.optional(),
		isActive: z.boolean().optional(),
		showOnLanding: z.boolean().optional()
	})
	.refine((data) => Object.values(data).some((v) => v !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui promo.'
	});

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
