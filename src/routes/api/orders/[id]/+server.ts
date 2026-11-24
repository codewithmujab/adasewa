import { and, eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAuth
} from '#lib/server/api/response';
import {
	rentalOrderItems,
	rentalOrders,
	type NewRentalOrder
} from '#lib/server/db/schema';
import {
	adminUpdateOrderSchema,
	customerPaymentConfirmSchema,
	orderIdParamSchema
} from '#lib/schemas/order';
import { awardOrderReturnPoints, refundOrderRedeemedPoints } from '#lib/server/points';
import { decrementPromoUsage } from '#lib/server/promo';
import { calculateEarnedPoints } from '#lib/utils/points';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const unauthorized = requireAuth(locals);
	if (unauthorized) return unauthorized;

	const idCheck = orderIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID pesanan tidak valid.', { status: 400 });
	}

	const [order] = await locals.db
		.select()
		.from(rentalOrders)
		.where(eq(rentalOrders.id, idCheck.data))
		.limit(1);

	const currentUser = locals.user!;
	if (!order || (order.userId !== currentUser.id && currentUser.role !== 'admin')) {
		return apiError('Pesanan tidak ditemukan.', { status: 404 });
	}

	const items = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(eq(rentalOrderItems.orderId, order.id));

	return apiSuccess(
		{ ...order, items },
		{ status: 200, headers: { 'Cache-Control': 'private, no-store' } }
	);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const unauthorized = requireAuth(locals);
	if (unauthorized) return unauthorized;

	const idCheck = orderIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID pesanan tidak valid.', { status: 400 });
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const [existing] = await locals.db
		.select()
		.from(rentalOrders)
		.where(eq(rentalOrders.id, idCheck.data))
		.limit(1);

	if (!existing) {
		return apiError('Pesanan tidak ditemukan.', { status: 404 });
	}

	const currentUser = locals.user!;
	const isAdmin = currentUser.role === 'admin';
	const bodyRecord =
		typeof parsedBody.data === 'object' && parsedBody.data !== null
			? (parsedBody.data as Record<string, unknown>)
			: {};

	// Alur 1: Pemesan mengirim konfirmasi pembayaran
	if (bodyRecord.action === 'confirm_payment') {
		if (existing.userId !== currentUser.id && !isAdmin) {
			return apiError('Akses ditolak.', { status: 403 });
		}

		const confirmValidation = customerPaymentConfirmSchema.safeParse(parsedBody.data);
		if (!confirmValidation.success) {
			return apiError('Catatan konfirmasi pembayaran tidak valid.', {
				status: 422,
				errors: formatZodErrors(confirmValidation.error)
			});
		}

		if (existing.paymentStatus === 'paid') {
			return apiError('Pembayaran untuk pesanan ini sudah lunas.', { status: 400 });
		}

		const [updated] = await locals.db
			.update(rentalOrders)
			.set({
				paymentStatus: 'waiting_verification',
				paymentProofNote: confirmValidation.data.paymentProofNote,
				paymentReference: confirmValidation.data.paymentReference || existing.paymentReference,
				updatedAt: new Date()
			})
			.where(eq(rentalOrders.id, existing.id))
			.returning();

		const items = await locals.db
			.select()
			.from(rentalOrderItems)
			.where(eq(rentalOrderItems.orderId, existing.id));

		return apiSuccess(
			{ ...updated, items },
			{
				status: 200,
				message: 'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi admin.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	}

	// Alur 2: Pembaruan penuh oleh Admin (verifikasi bayar, status sewa, & verifikasi pengembalian)
	if (!isAdmin) {
		return apiError('Hanya admin yang dapat mengubah status transaksi ini.', { status: 403 });
	}

	const adminValidation = adminUpdateOrderSchema.safeParse(parsedBody.data);
	if (!adminValidation.success) {
		return apiError('Data pembaruan transaksi tidak valid.', {
			status: 422,
			errors: formatZodErrors(adminValidation.error)
		});
	}

	const input = adminValidation.data;
	const updatePayload: Partial<NewRentalOrder> = {
		updatedAt: new Date()
	};

	if (input.orderStatus !== undefined) {
		updatePayload.orderStatus = input.orderStatus;
		if (input.orderStatus === 'returned' && !existing.returnedAt) {
			updatePayload.returnedAt = new Date();
		}
	}

	if (input.paymentStatus !== undefined) {
		updatePayload.paymentStatus = input.paymentStatus;
		if (input.paymentStatus === 'paid' && !existing.paidAt) {
			updatePayload.paidAt = new Date();
			if (!input.orderStatus && existing.orderStatus === 'pending_payment') {
				updatePayload.orderStatus = 'confirmed';
			}
		}
	}

	if (input.paymentReference !== undefined) updatePayload.paymentReference = input.paymentReference;
	if (input.depositAmount !== undefined) updatePayload.depositAmount = input.depositAmount;
	if (input.returnCondition !== undefined) updatePayload.returnCondition = input.returnCondition;
	if (input.returnNotes !== undefined) updatePayload.returnNotes = input.returnNotes;

	const nextDeliveryFee = input.deliveryFee ?? existing.deliveryFee;
	const nextLateFee = input.lateFee ?? existing.lateFee;
	if (input.deliveryFee !== undefined || input.lateFee !== undefined) {
		updatePayload.deliveryFee = nextDeliveryFee;
		updatePayload.lateFee = nextLateFee;
		updatePayload.totalAmount = Math.max(
			0,
			existing.subtotalAmount +
				nextDeliveryFee +
				nextLateFee -
				existing.promoDiscountAmount -
				existing.pointsDiscountAmount
		);
	}

	let [updated] = await locals.db
		.update(rentalOrders)
		.set(updatePayload)
		.where(eq(rentalOrders.id, existing.id))
		.returning();

	// Kreditkan Poin Sewa otomatis ke Rekening Poin penyewa saat barang selesai dikembalikan (idempoten)
	const resolvedOrderStatus = input.orderStatus ?? existing.orderStatus;
	const resolvedReturnCondition =
		input.returnCondition !== undefined ? input.returnCondition : existing.returnCondition;

	let awardedPointsNow = 0;
	if (resolvedOrderStatus === 'returned' && !existing.pointsAwardedAt) {
		const computedPoints =
			input.pointsToAward !== undefined
				? input.pointsToAward
				: calculateEarnedPoints(existing.subtotalAmount, resolvedReturnCondition);

		const awardResult = await awardOrderReturnPoints(locals.db, {
			orderId: existing.id,
			orderCode: existing.orderCode,
			userId: existing.userId,
			points: computedPoints
		});

		if (awardResult) {
			awardedPointsNow = awardResult.awarded;
			const [refreshed] = await locals.db
				.select()
				.from(rentalOrders)
				.where(eq(rentalOrders.id, existing.id))
				.limit(1);
			if (refreshed) updated = refreshed;
		}
	}

	// Jika pesanan dibatalkan: kembalikan poin & kuota promo (hanya saat transisi menuju cancelled)
	if (resolvedOrderStatus === 'cancelled' && existing.orderStatus !== 'cancelled') {
		if (existing.pointsRedeemed > 0) {
			await refundOrderRedeemedPoints(locals.db, {
				orderId: existing.id,
				orderCode: existing.orderCode,
				userId: existing.userId,
				pointsRedeemed: existing.pointsRedeemed
			});
		}
		if (existing.promoId) {
			await decrementPromoUsage(locals.db, existing.promoId);
		}
	}

	// Perbarui status pengembalian per barang jika dikirim atau otomatis saat status "returned"
	if (input.itemReturns && input.itemReturns.length > 0) {
		for (const itemRet of input.itemReturns) {
			await locals.db
				.update(rentalOrderItems)
				.set({
					returnedQty: itemRet.returnedQty,
					returnCondition: itemRet.returnCondition
				})
				.where(
					and(
						eq(rentalOrderItems.id, itemRet.orderItemId),
						eq(rentalOrderItems.orderId, existing.id)
					)
				);
		}
	} else if (input.orderStatus === 'returned') {
		const currentItems = await locals.db
			.select()
			.from(rentalOrderItems)
			.where(eq(rentalOrderItems.orderId, existing.id));
		for (const row of currentItems) {
			if (row.returnedQty === 0) {
				await locals.db
					.update(rentalOrderItems)
					.set({
						returnedQty: row.quantity,
						returnCondition:
							input.returnCondition === 'damaged' || input.returnCondition === 'missing_part'
								? 'damaged'
								: 'good'
					})
					.where(eq(rentalOrderItems.id, row.id));
			}
		}
	}

	const updatedItems = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(eq(rentalOrderItems.orderId, existing.id));

	const successMessage =
		awardedPointsNow > 0
			? `Transaksi diperbarui & +${awardedPointsNow} Poin otomatis masuk ke Rekening Poin penyewa.`
			: 'Transaksi dan status pengembalian berhasil diperbarui.';

	return apiSuccess(
		{ ...updated, items: updatedItems },
		{
			status: 200,
			message: successMessage,
			headers: { 'Cache-Control': 'private, no-store' }
		}
	);
};
