import { z } from 'zod';
import { uuidSchema } from '#lib/schemas/common';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const orderIdParamSchema = uuidSchema;

export const createOrderItemInputSchema = z.object({
	itemId: uuidSchema,
	variant: z.string().trim().max(120).nullable().optional(),
	quantity: z.number().int().min(1, 'Jumlah minimal 1 unit.').max(500, 'Jumlah maksimal 500 unit.')
});

export const createOrderSchema = z
	.object({
		customerName: z
			.string()
			.trim()
			.min(2, 'Nama lengkap minimal 2 karakter.')
			.max(160, 'Nama lengkap maksimal 160 karakter.'),
		customerPhone: z
			.string()
			.trim()
			.min(8, 'Nomor HP/WhatsApp minimal 8 digit.')
			.max(40, 'Nomor HP maksimal 40 karakter.'),
		emergencyPhone: z
			.string()
			.trim()
			.max(40, 'Nomor HP darurat maksimal 40 karakter.')
			.nullable()
			.optional(),
		deliveryMethod: z.enum(['delivery', 'pickup']),
		deliveryRegion: z.string().trim().max(64).nullable().optional(),
		deliveryAddress: z.string().trim().max(1500).nullable().optional(),
		startDate: z.string().regex(ISO_DATE_REGEX, 'Format tanggal mulai harus YYYY-MM-DD.'),
		endDate: z.string().regex(ISO_DATE_REGEX, 'Format tanggal selesai harus YYYY-MM-DD.'),
		paymentMethod: z.enum(['bank_transfer', 'qris', 'ewallet', 'cod_kios']),
		promoCode: z.string().trim().max(40).nullable().optional(),
		pointsToRedeem: z.number().int().min(0).max(1_000_000).default(0),
		infoSource: z.string().trim().max(64).nullable().optional(),
		notes: z.string().trim().max(1500).nullable().optional(),
		items: z
			.array(createOrderItemInputSchema)
			.min(1, 'Minimal pilih 1 barang di keranjang untuk membuat pesanan.')
			.max(50, 'Maksimal 50 jenis barang dalam satu transaksi.')
	})
	.superRefine((data, ctx) => {
		if (data.endDate < data.startDate) {
			ctx.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
			});
		}
		if (data.deliveryMethod === 'delivery') {
			if (!data.deliveryRegion || data.deliveryRegion.trim().length < 2) {
				ctx.addIssue({
					code: 'custom',
					path: ['deliveryRegion'],
					message: 'Pilih wilayah pengiriman (DKI / Jabar / Jateng / DIY).'
				});
			}
			if (!data.deliveryAddress || data.deliveryAddress.trim().length < 10) {
				ctx.addIssue({
					code: 'custom',
					path: ['deliveryAddress'],
					message: 'Masukkan alamat pengiriman lengkap (minimal 10 karakter).'
				});
			}
			if (data.paymentMethod === 'cod_kios') {
				ctx.addIssue({
					code: 'custom',
					path: ['paymentMethod'],
					message: 'Bayar di Kios hanya berlaku untuk metode Ambil Langsung di Kios.'
				});
			}
		}
	});

export const customerPaymentConfirmSchema = z.object({
	action: z.literal('confirm_payment'),
	paymentProofNote: z
		.string()
		.trim()
		.min(3, 'Tuliskan nama pengirim / catatan bukti transfer.')
		.max(500, 'Catatan pembayaran maksimal 500 karakter.'),
	paymentReference: z.string().trim().max(120).optional()
});

export const customerReturnRequestSchema = z.object({
	returnMethod: z.enum(['pickup_courier', 'drop_off_kios']),
	returnNotes: z.string().trim().max(1000).nullable().optional()
});

export const adminItemReturnSchema = z.object({
	orderItemId: uuidSchema,
	returnedQty: z.number().int().min(0).max(500),
	returnCondition: z.enum(['pending', 'good', 'damaged'])
});

export const adminUpdateOrderSchema = z
	.object({
		orderStatus: z
			.enum([
				'pending_payment',
				'confirmed',
				'active_rental',
				'return_requested',
				'returned',
				'cancelled'
			])
			.optional(),
		paymentStatus: z
			.enum(['unpaid', 'waiting_verification', 'paid', 'failed', 'refunded'])
			.optional(),
		paymentReference: z.string().trim().max(120).nullable().optional(),
		deliveryFee: z.number().int().min(0).max(100_000_000).optional(),
		depositAmount: z.number().int().min(0).max(100_000_000).optional(),
		lateFee: z.number().int().min(0).max(100_000_000).optional(),
		pointsToAward: z.number().int().min(0).max(1_000_000).optional(),
		returnCondition: z
			.enum(['good', 'minor_issue', 'damaged', 'missing_part'])
			.nullable()
			.optional(),
		returnNotes: z.string().trim().max(2000).nullable().optional(),
		itemReturns: z.array(adminItemReturnSchema).max(50).optional()
	})
	.refine((val) => Object.values(val).some((entry) => entry !== undefined), {
		message: 'Minimal satu field harus dikirim untuk memperbarui pesanan.'
	});

export const adminAdjustPointsSchema = z.object({
	userId: z.string().trim().min(1, 'Pilih penyewa terlebih dahulu.'),
	delta: z
		.number()
		.int('Jumlah poin harus bilangan bulat.')
		.min(-1_000_000)
		.max(1_000_000)
		.refine((v) => v !== 0, { message: 'Jumlah penyesuaian poin tidak boleh 0.' }),
	description: z
		.string()
		.trim()
		.min(3, 'Tuliskan alasan penyesuaian poin minimal 3 karakter.')
		.max(280, 'Keterangan maksimal 280 karakter.')
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CustomerPaymentConfirmInput = z.infer<typeof customerPaymentConfirmSchema>;
export type CustomerReturnRequestInput = z.infer<typeof customerReturnRequestSchema>;
export type AdminUpdateOrderInput = z.infer<typeof adminUpdateOrderSchema>;
export type AdminAdjustPointsInput = z.infer<typeof adminAdjustPointsSchema>;
