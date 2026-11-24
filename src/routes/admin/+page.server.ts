import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import {
	branches,
	portfolios,
	rentalCategories,
	rentalItems,
	rentalOrders,
	services
} from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';
	const scopedBranchId = !isSuperAdmin ? (currentUser.branchId ?? null) : null;

	const orderBranchCond = scopedBranchId ? eq(rentalOrders.branchId, scopedBranchId) : undefined;

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
		recentCatalogItems,
		allBranches,
		ordersByBranchRows
	] = await Promise.all([
		orderBranchCond
			? locals.db.select({ total: count() }).from(rentalOrders).where(orderBranchCond)
			: locals.db.select({ total: count() }).from(rentalOrders),
		locals.db
			.select({ total: count() })
			.from(rentalOrders)
			.where(
				orderBranchCond
					? and(orderBranchCond, inArray(rentalOrders.orderStatus, ['confirmed', 'active_rental']))
					: inArray(rentalOrders.orderStatus, ['confirmed', 'active_rental'])
			),
		locals.db
			.select({ total: count() })
			.from(rentalOrders)
			.where(
				orderBranchCond
					? and(orderBranchCond, eq(rentalOrders.orderStatus, 'return_requested'))
					: eq(rentalOrders.orderStatus, 'return_requested')
			),
		locals.db.select({ total: count() }).from(rentalItems),
		locals.db
			.select({ total: count() })
			.from(rentalItems)
			.where(eq(rentalItems.isPublished, true)),
		locals.db.select({ total: count() }).from(rentalCategories),
		locals.db.select({ total: count() }).from(services),
		locals.db.select({ total: count() }).from(portfolios),
		orderBranchCond
			? locals.db
					.select()
					.from(rentalOrders)
					.where(orderBranchCond)
					.orderBy(desc(rentalOrders.createdAt))
					.limit(6)
			: locals.db.select().from(rentalOrders).orderBy(desc(rentalOrders.createdAt)).limit(6),
		locals.db.select().from(rentalItems).orderBy(desc(rentalItems.updatedAt)).limit(6),
		isSuperAdmin
			? locals.db.select().from(branches).orderBy(asc(branches.sortOrder), asc(branches.name))
			: Promise.resolve([]),
		isSuperAdmin
			? locals.db
					.select({
						branchId: rentalOrders.branchId,
						orderCount: sql<number>`count(*)::int`,
						totalRevenue: sql<number>`coalesce(sum(${rentalOrders.totalAmount}), 0)::int`
					})
					.from(rentalOrders)
					.groupBy(rentalOrders.branchId)
			: Promise.resolve([])
	]);

	const summaryByBranch = new Map(
		ordersByBranchRows
			.filter((r): r is { branchId: string; orderCount: number; totalRevenue: number } =>
				Boolean(r.branchId)
			)
			.map((r) => [r.branchId, { orderCount: r.orderCount, totalRevenue: r.totalRevenue }])
	);

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
		branchBreakdown: allBranches.map((b) => ({
			id: b.id,
			code: b.code,
			name: b.name,
			city: b.city,
			phone: b.phone,
			orderCount: summaryByBranch.get(b.id)?.orderCount ?? 0,
			totalRevenue: summaryByBranch.get(b.id)?.totalRevenue ?? 0
		})),
		recentOrders,
		recentCatalogItems
	};
};
