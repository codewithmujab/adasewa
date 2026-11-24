import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '#lib/server/db';
import {
	pointTransactions,
	rentalOrders,
	user,
	type PointTransaction
} from '#lib/server/db/schema';

export async function getUserPointBalance(db: Database, userId: string): Promise<number> {
	const [row] = await db
		.select({ pointBalance: user.pointBalance })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return row?.pointBalance ?? 0;
}

export async function recordPointMovement(
	db: Database,
	params: {
		userId: string;
		delta: number;
		type: 'earn_return' | 'redeem_checkout' | 'refund_cancel' | 'admin_adjust';
		description: string;
		orderId?: string | null;
		orderCode?: string | null;
	}
): Promise<{ newBalance: number; transaction: PointTransaction } | null> {
	const cleanDelta = Math.trunc(params.delta);
	if (cleanDelta === 0) return null;

	// Cegah saldo negatif secara atomik bila debit
	const whereCondition =
		cleanDelta < 0
			? and(eq(user.id, params.userId), sql`${user.pointBalance} >= ${Math.abs(cleanDelta)}`)
			: eq(user.id, params.userId);

	const [updatedUser] = await db
		.update(user)
		.set({
			pointBalance: sql`${user.pointBalance} + ${cleanDelta}`,
			updatedAt: new Date()
		})
		.where(whereCondition)
		.returning({ pointBalance: user.pointBalance });

	if (!updatedUser) {
		return null;
	}

	const [tx] = await db
		.insert(pointTransactions)
		.values({
			userId: params.userId,
			orderId: params.orderId ?? null,
			orderCode: params.orderCode ?? null,
			type: params.type,
			points: cleanDelta,
			balanceAfter: updatedUser.pointBalance,
			description: params.description
		})
		.returning();

	if (!tx) return null;

	return {
		newBalance: updatedUser.pointBalance,
		transaction: tx
	};
}

/**
 * Mengkreditkan poin ke Rekening Poin penyewa setelah barang dikembalikan (idempoten).
 */
export async function awardOrderReturnPoints(
	db: Database,
	params: {
		orderId: string;
		orderCode: string;
		userId: string;
		points: number;
	}
): Promise<{ awarded: number; newBalance: number } | null> {
	const cleanPoints = Math.max(0, Math.trunc(params.points));
	const now = new Date();

	// Guard idempoten: hanya proses jika points_awarded_at masih NULL
	const [claimed] = await db
		.update(rentalOrders)
		.set({
			pointsEarned: cleanPoints,
			pointsAwardedAt: now,
			updatedAt: now
		})
		.where(and(eq(rentalOrders.id, params.orderId), sql`${rentalOrders.pointsAwardedAt} IS NULL`))
		.returning({ id: rentalOrders.id });

	if (!claimed) {
		return null;
	}

	if (cleanPoints === 0) {
		const balance = await getUserPointBalance(db, params.userId);
		return { awarded: 0, newBalance: balance };
	}

	const movement = await recordPointMovement(db, {
		userId: params.userId,
		delta: cleanPoints,
		type: 'earn_return',
		orderId: params.orderId,
		orderCode: params.orderCode,
		description: `Poin sewa dari pengembalian pesanan ${params.orderCode}`
	});

	if (!movement) return null;
	return { awarded: cleanPoints, newBalance: movement.newBalance };
}

/**
 * Mengembalikan poin yang sempat dipakai saat checkout jika pesanan dibatalkan (idempoten).
 */
export async function refundOrderRedeemedPoints(
	db: Database,
	params: {
		orderId: string;
		orderCode: string;
		userId: string;
		pointsRedeemed: number;
	}
): Promise<boolean> {
	if (params.pointsRedeemed <= 0) return false;

	const existingRefund = await db
		.select({ id: pointTransactions.id })
		.from(pointTransactions)
		.where(
			and(
				eq(pointTransactions.orderId, params.orderId),
				eq(pointTransactions.type, 'refund_cancel')
			)
		)
		.limit(1);

	if (existingRefund.length > 0) return false;

	const movement = await recordPointMovement(db, {
		userId: params.userId,
		delta: params.pointsRedeemed,
		type: 'refund_cancel',
		orderId: params.orderId,
		orderCode: params.orderCode,
		description: `Pengembalian poin dari pesanan dibatalkan ${params.orderCode}`
	});

	return Boolean(movement);
}
