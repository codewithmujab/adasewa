import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAuth
} from '#lib/server/api/response';
import {
	branchItemStocks,
	branches,
	pointTransactions,
	rentalCategories,
	rentalItems,
	rentalOrderItems,
	rentalOrders,
	type Branch,
	type BranchItemStock,
	type RentalCategory,
	type RentalItem,
	type RentalOrder,
	type RentalOrderItem
} from '#lib/server/db/schema';
import { createOrderSchema } from '#lib/schemas/order';
import { getUserPointBalance, recordPointMovement } from '#lib/server/points';
import { incrementPromoUsage, validatePromoForSubtotal } from '#lib/server/promo';
import { calculateDurationDays } from '#lib/utils/orders';
import {
	calculateMaxRedeemablePoints,
	calculatePointDiscountIdr
} from '#lib/utils/points';
import type { RequestHandler } from './$types';

function generateOrderCode(branchCode: string): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	const rand = Math.floor(1000 + Math.random() * 9000);
	const cleanCode = branchCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4) || 'ASW';
	return `ASW-${cleanCode}-${y}${m}${d}-${rand}`;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const unauthorized = requireAuth(locals);
	if (unauthorized) return unauthorized;

	const currentUser = locals.user!;
	const wantsAll = url.searchParams.get('scope') === 'all';
	const filterBranchId = url.searchParams.get('branchId');
	const isSuperAdmin = currentUser.role === 'admin';
	const isBranchAdmin = currentUser.role === 'branch_admin';

	let orders: RentalOrder[];
	if (wantsAll && isSuperAdmin) {
		orders = filterBranchId
			? await locals.db
					.select()
					.from(rentalOrders)
					.where(eq(rentalOrders.branchId, filterBranchId))
					.orderBy(desc(rentalOrders.createdAt))
					.limit(100)
			: await locals.db
					.select()
					.from(rentalOrders)
					.orderBy(desc(rentalOrders.createdAt))
					.limit(100);
	} else if (wantsAll && isBranchAdmin && currentUser.branchId) {
		orders = await locals.db
			.select()
			.from(rentalOrders)
			.where(eq(rentalOrders.branchId, currentUser.branchId))
			.orderBy(desc(rentalOrders.createdAt))
			.limit(100);
	} else {
		orders = await locals.db
			.select()
			.from(rentalOrders)
			.where(eq(rentalOrders.userId, currentUser.id))
			.orderBy(desc(rentalOrders.createdAt))
			.limit(100);
	}

	if (orders.length === 0) {
		return apiSuccess([], {
			status: 200,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const orderIds = orders.map((o) => o.id);
	const allOrderItems = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(inArray(rentalOrderItems.orderId, orderIds));

	const itemsByOrderId = new Map<string, RentalOrderItem[]>();
	for (const line of allOrderItems) {
		const bucket = itemsByOrderId.get(line.orderId);
		if (bucket) {
			bucket.push(line);
		} else {
			itemsByOrderId.set(line.orderId, [line]);
		}
	}

	const result = orders.map((order) => ({
		...order,
		items: itemsByOrderId.get(order.id) ?? []
	}));

	return apiSuccess(result, {
		status: 200,
		headers: { 'Cache-Control': 'private, no-store' }
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAuth(
		locals,
		'Silakan daftar atau masuk terlebih dahulu untuk membuat pesanan.'
	);
	if (unauthorized) return unauthorized;

	const currentUser = locals.user!;
	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = createOrderSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data pesanan belum lengkap atau tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const uniqueItemIds = Array.from(new Set(input.items.map((i) => i.itemId)));

	// Resolusi cabang penyewaan (Bogor / Depok / cabang aktif lainnya)
	let selectedBranch: Branch | undefined;
	if (input.branchId) {
		const [foundBranch] = await locals.db
			.select()
			.from(branches)
			.where(and(eq(branches.id, input.branchId), eq(branches.isActive, true)))
			.limit(1);
		selectedBranch = foundBranch;
	} else {
		const [firstActive] = await locals.db
			.select()
			.from(branches)
			.where(eq(branches.isActive, true))
			.orderBy(asc(branches.sortOrder))
			.limit(1);
		selectedBranch = firstActive;
	}

	if (!selectedBranch) {
		return apiError('Cabang penyewaan tidak ditemukan atau sedang tidak aktif.', { status: 422 });
	}

	const [dbItems, dbCategories, branchStocks] = await Promise.all([
		locals.db.select().from(rentalItems).where(inArray(rentalItems.id, uniqueItemIds)),
		locals.db.select().from(rentalCategories),
		locals.db
			.select()
			.from(branchItemStocks)
			.where(
				and(
					eq(branchItemStocks.branchId, selectedBranch.id),
					inArray(branchItemStocks.rentalItemId, uniqueItemIds)
				)
			)
	]);

	const itemMap = new Map<string, RentalItem>(dbItems.map((i) => [i.id, i]));
	const categoryMap = new Map<string, RentalCategory>(dbCategories.map((c) => [c.id, c]));
	const stockMap = new Map<string, BranchItemStock>(branchStocks.map((s) => [s.rentalItemId, s]));

	const durationDays = calculateDurationDays(input.startDate, input.endDate);

	const preparedLines: Array<{
		rentalItemId: string;
		itemName: string;
		itemSlug: string;
		categoryName: string;
		variant: string | null;
		quantity: number;
		unitPrice: number;
		unitLabel: string;
		durationDays: number;
		lineTotal: number;
	}> = [];

	let subtotalAmount = 0;

	for (const reqItem of input.items) {
		const dbItem = itemMap.get(reqItem.itemId);
		if (!dbItem || !dbItem.isPublished) {
			return apiError('Salah satu barang di keranjang tidak lagi tersedia.', {
				status: 400
			});
		}

		const branchStock = stockMap.get(dbItem.id);
		if (branchStock && (!branchStock.isAvailable || branchStock.stockQty <= 0)) {
			return apiError(
				`Barang "${dbItem.name}" sedang tidak tersedia di ${selectedBranch.name}.`,
				{ status: 400 }
			);
		}

		const categoryName = categoryMap.get(dbItem.categoryId)?.name ?? 'Lainnya';
		// Gunakan harga otoritatif khusus cabang ini dari branch_item_stocks!
		const unitPrice = branchStock ? branchStock.pricePerDay : (dbItem.pricePerDay ?? 0);
		const lineTotal = unitPrice * reqItem.quantity * durationDays;
		subtotalAmount += lineTotal;

		preparedLines.push({
			rentalItemId: dbItem.id,
			itemName: dbItem.name,
			itemSlug: dbItem.slug,
			categoryName,
			variant: reqItem.variant?.trim() ? reqItem.variant.trim() : null,
			quantity: reqItem.quantity,
			unitPrice,
			unitLabel: dbItem.unitLabel,
			durationDays,
			lineTotal
		});
	}

	const deliveryFee =
		input.deliveryMethod === 'pickup' ? 0 : selectedBranch.deliveryFeeDefault;

	// 1. Validasi & hitung Promo Diskon secara otoritatif di server (termasuk cek cabang!)
	let appliedPromoId: string | null = null;
	let appliedPromoCode: string | null = null;
	let promoDiscountAmount = 0;

	if (input.promoCode && input.promoCode.trim().length > 0) {
		const promoCheck = await validatePromoForSubtotal(
			locals.db,
			input.promoCode,
			subtotalAmount,
			selectedBranch.id
		);
		if (!promoCheck.ok) {
			return apiError(promoCheck.message, { status: 422 });
		}
		appliedPromoId = promoCheck.promo.id;
		appliedPromoCode = promoCheck.promo.code;
		promoDiscountAmount = promoCheck.discountAmount;
	}

	// 2. Validasi & hitung pemakaian poin dari Rekening Poin penyewa (terhadap sisa subtotal setelah promo)
	const subtotalAfterPromo = Math.max(0, subtotalAmount - promoDiscountAmount);
	let pointsRedeemed = 0;
	let pointsDiscountAmount = 0;
	if (input.pointsToRedeem > 0) {
		const currentBalance = await getUserPointBalance(locals.db, currentUser.id);
		const maxRedeemable = calculateMaxRedeemablePoints(subtotalAfterPromo, currentBalance);
		if (input.pointsToRedeem > maxRedeemable) {
			return apiError(
				`Poin yang dipakai melebihi batas (maksimal ${maxRedeemable} poin dari saldo ${currentBalance} poin).`,
				{ status: 422 }
			);
		}
		pointsRedeemed = input.pointsToRedeem;
		pointsDiscountAmount = calculatePointDiscountIdr(pointsRedeemed);
	}

	const totalAmount = Math.max(
		0,
		subtotalAmount + deliveryFee - promoDiscountAmount - pointsDiscountAmount
	);
	const orderCode = generateOrderCode(selectedBranch.code);
	const paymentReference = `PAY-${orderCode}`;

	try {
		// Kunci kuota promo secara atomik bila memakai kode promo
		if (appliedPromoId) {
			const incremented = await incrementPromoUsage(locals.db, appliedPromoId);
			if (!incremented) {
				return apiError(`Kuota kode promo "${appliedPromoCode}" baru saja habis.`, {
					status: 409
				});
			}
		}

		// Potong saldo Rekening Poin terlebih dahulu secara atomik bila memakai poin
		let redeemedTxId: string | null = null;
		if (pointsRedeemed > 0) {
			const debited = await recordPointMovement(locals.db, {
				userId: currentUser.id,
				delta: -pointsRedeemed,
				type: 'redeem_checkout',
				orderCode,
				description: `Pemakaian ${pointsRedeemed} poin untuk potongan pesanan ${orderCode}`
			});
			if (!debited) {
				return apiError('Saldo Rekening Poin tidak mencukupi. Silakan muat ulang halaman.', {
					status: 409
				});
			}
			redeemedTxId = debited.transaction.id;
		}

		const [createdOrder] = await locals.db
			.insert(rentalOrders)
			.values({
				orderCode,
				branchId: selectedBranch.id,
				branchName: selectedBranch.name,
				branchAddress: selectedBranch.address,
				branchWhatsapp: selectedBranch.whatsapp,
				userId: currentUser.id,
				customerName: input.customerName,
				customerEmail: currentUser.email,
				customerPhone: input.customerPhone,
				emergencyPhone: input.emergencyPhone?.trim() || null,
				deliveryMethod: input.deliveryMethod,
				deliveryRegion:
					input.deliveryMethod === 'delivery'
						? (input.deliveryRegion ?? selectedBranch.city)
						: `Ambil di Kios ${selectedBranch.name}`,
				deliveryAddress:
					input.deliveryMethod === 'delivery' ? (input.deliveryAddress?.trim() ?? null) : null,
				infoSource: input.infoSource?.trim() || null,
				notes: input.notes?.trim() || null,
				startDate: input.startDate,
				endDate: input.endDate,
				durationDays,
				subtotalAmount,
				deliveryFee,
				depositAmount: 0,
				lateFee: 0,
				promoId: appliedPromoId,
				promoCode: appliedPromoCode,
				promoDiscountAmount,
				pointsRedeemed,
				pointsDiscountAmount,
				pointsEarned: 0,
				totalAmount,
				paymentMethod: input.paymentMethod,
				paymentProvider: 'manual',
				paymentReference,
				paymentStatus: 'unpaid',
				orderStatus: 'pending_payment'
			})
			.returning();

		if (!createdOrder) {
			return apiError('Gagal mencatat transaksi pesanan.', { status: 500 });
		}

		if (redeemedTxId) {
			await locals.db
				.update(pointTransactions)
				.set({ orderId: createdOrder.id })
				.where(eq(pointTransactions.id, redeemedTxId));
		}

		const createdItems = await locals.db
			.insert(rentalOrderItems)
			.values(
				preparedLines.map((line) => ({
					orderId: createdOrder.id,
					rentalItemId: line.rentalItemId,
					itemName: line.itemName,
					itemSlug: line.itemSlug,
					categoryName: line.categoryName,
					variant: line.variant,
					quantity: line.quantity,
					unitPrice: line.unitPrice,
					unitLabel: line.unitLabel,
					durationDays: line.durationDays,
					lineTotal: line.lineTotal,
					returnedQty: 0,
					returnCondition: 'pending'
				}))
			)
			.returning();

		return apiSuccess(
			{
				...createdOrder,
				items: createdItems
			},
			{
				status: 201,
				message: 'Pesanan berhasil dibuat dan tercatat.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	} catch (error: unknown) {
		console.error('[POST /api/orders] Database error:', error);
		return apiError('Terjadi kesalahan saat menyimpan transaksi pesanan.', { status: 500 });
	}
};
