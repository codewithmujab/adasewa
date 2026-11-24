import { count, desc, eq, inArray } from 'drizzle-orm';
import {
	portfolios,
	rentalCategories,
	rentalItems,
	rentalOrders,
	services
} from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [
		totalOrdersRes,
		activeOrdersRes,
		returnReqRes,
		totalCatalogRes,
		publishedCatalogRes,
		totalCategoriesRes,
		totalServicesRes,
		totalPortfoliosRes,
		recentOrders,
		recentCatalogItems
	] = await Promise.all([
		locals.db.select({ total: count() }).from(rentalOrders),
		locals.db
			.select({ total: count() })
			.from(rentalOrders)
			.where(inArray(rentalOrders.orderStatus, ['confirmed', 'active_rental'])),
		locals.db
			.select({ total: count() })
			.from(rentalOrders)
			.where(eq(rentalOrders.orderStatus, 'return_requested')),
		locals.db.select({ total: count() }).from(rentalItems),
		locals.db
			.select({ total: count() })
			.from(rentalItems)
			.where(eq(rentalItems.isPublished, true)),
		locals.db.select({ total: count() }).from(rentalCategories),
		locals.db.select({ total: count() }).from(services),
		locals.db.select({ total: count() }).from(portfolios),
		locals.db.select().from(rentalOrders).orderBy(desc(rentalOrders.createdAt)).limit(6),
		locals.db.select().from(rentalItems).orderBy(desc(rentalItems.updatedAt)).limit(6)
	]);

	return {
		stats: {
			totalOrders: Number(totalOrdersRes[0]?.total ?? 0),
			activeOrders: Number(activeOrdersRes[0]?.total ?? 0),
			returnRequestedOrders: Number(returnReqRes[0]?.total ?? 0),
			totalCatalog: Number(totalCatalogRes[0]?.total ?? 0),
			publishedCatalog: Number(publishedCatalogRes[0]?.total ?? 0),
			totalCategories: Number(totalCategoriesRes[0]?.total ?? 0),
			totalServices: Number(totalServicesRes[0]?.total ?? 0),
			totalPortfolios: Number(totalPortfoliosRes[0]?.total ?? 0)
		},
		recentOrders,
		recentCatalogItems
	};
};
