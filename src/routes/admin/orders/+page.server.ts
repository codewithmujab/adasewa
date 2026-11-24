import { desc, inArray } from 'drizzle-orm';
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
	const orders = await locals.db
		.select()
		.from(rentalOrders)
		.orderBy(desc(rentalOrders.createdAt))
		.limit(200);

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
