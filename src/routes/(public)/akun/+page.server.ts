import { redirect } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';
import {
	pointTransactions,
	rentalOrderItems,
	rentalOrders,
	type PointTransaction,
	type RentalOrder,
	type RentalOrderItem
} from '#lib/server/db/schema';
import { getUserPointBalance } from '#lib/server/points';
import type { PageServerLoad } from './$types';

export interface OrderWithItems extends RentalOrder {
	items: RentalOrderItem[];
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		redirect(303, '/login?redirectTo=%2Fakun');
	}

	const [orders, pointBalance, pointHistory] = await Promise.all([
		locals.db
			.select()
			.from(rentalOrders)
			.where(eq(rentalOrders.userId, locals.user.id))
			.orderBy(desc(rentalOrders.createdAt))
			.limit(100),
		getUserPointBalance(locals.db, locals.user.id),
		locals.db
			.select()
			.from(pointTransactions)
			.where(eq(pointTransactions.userId, locals.user.id))
			.orderBy(desc(pointTransactions.createdAt))
			.limit(50)
	]);

	const itemsByOrderId = new Map<string, RentalOrderItem[]>();
	if (orders.length > 0) {
		const orderIds = orders.map((o) => o.id);
		const allItems = await locals.db
			.select()
			.from(rentalOrderItems)
			.where(inArray(rentalOrderItems.orderId, orderIds));

		for (const item of allItems) {
			const bucket = itemsByOrderId.get(item.orderId);
			if (bucket) {
				bucket.push(item);
			} else {
				itemsByOrderId.set(item.orderId, [item]);
			}
		}
	}

	const ordersWithItems: OrderWithItems[] = orders.map((order) => ({
		...order,
		items: itemsByOrderId.get(order.id) ?? []
	}));

	const totalEarnedPoints = pointHistory
		.filter((tx) => tx.points > 0)
		.reduce((acc, tx) => acc + tx.points, 0);
	const totalRedeemedPoints = pointHistory
		.filter((tx) => tx.points < 0)
		.reduce((acc, tx) => acc + Math.abs(tx.points), 0);

	const stats = {
		totalOrders: ordersWithItems.length,
		pendingPayment: ordersWithItems.filter(
			(o) => o.orderStatus === 'pending_payment' || o.paymentStatus === 'unpaid'
		).length,
		activeRentals: ordersWithItems.filter(
			(o) => o.orderStatus === 'confirmed' || o.orderStatus === 'active_rental'
		).length,
		returnInProgress: ordersWithItems.filter((o) => o.orderStatus === 'return_requested').length,
		completedReturned: ordersWithItems.filter((o) => o.orderStatus === 'returned').length
	};

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role ?? 'customer'
		},
		orders: ordersWithItems,
		stats,
		points: {
			balance: pointBalance,
			totalEarned: totalEarnedPoints,
			totalRedeemed: totalRedeemedPoints,
			history: pointHistory as PointTransaction[]
		}
	};
};
