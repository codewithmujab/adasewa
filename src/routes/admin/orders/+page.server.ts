import { desc, eq, inArray } from 'drizzle-orm';
import {
	rentalOrderItems,
	rentalOrders,
	type RentalOrder,
	type RentalOrderItem
} from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export interface AdminOrderWithItems extends RentalOrder {
	items: RentalOrderItem[];
}

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';

	const orders = isSuperAdmin
		? await locals.db
				.select()
				.from(rentalOrders)
				.orderBy(desc(rentalOrders.createdAt))
				.limit(200)
		: currentUser.branchId
			? await locals.db
					.select()
					.from(rentalOrders)
					.where(eq(rentalOrders.branchId, currentUser.branchId))
					.orderBy(desc(rentalOrders.createdAt))
					.limit(200)
			: [];

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

	const ordersWithItems: AdminOrderWithItems[] = orders.map((order) => ({
		...order,
		items: itemsByOrderId.get(order.id) ?? []
	}));

	return {
		orders: ordersWithItems
	};
};
