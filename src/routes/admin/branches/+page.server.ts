import { asc, eq, inArray, sql } from 'drizzle-orm';
import { branches, rentalOrders, user } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';

	const [branchRows, staffRows, orderSummaryRows] = await Promise.all([
		isSuperAdmin
			? locals.db.select().from(branches).orderBy(asc(branches.sortOrder), asc(branches.name))
			: currentUser.branchId
				? locals.db.select().from(branches).where(eq(branches.id, currentUser.branchId))
				: Promise.resolve([]),
		locals.db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				branchId: user.branchId
			})
			.from(user)
			.where(inArray(user.role, ['admin', 'branch_admin'])),
		locals.db
			.select({
				branchId: rentalOrders.branchId,
				orderCount: sql<number>`count(*)::int`,
				totalRevenue: sql<number>`coalesce(sum(${rentalOrders.totalAmount}), 0)::int`
			})
			.from(rentalOrders)
			.groupBy(rentalOrders.branchId)
	]);

	const summaryByBranch = new Map(
		orderSummaryRows
			.filter((r): r is { branchId: string; orderCount: number; totalRevenue: number } =>
				Boolean(r.branchId)
			)
			.map((r) => [r.branchId, { orderCount: r.orderCount, totalRevenue: r.totalRevenue }])
	);

	return {
		branchList: branchRows.map((b) => ({
			...b,
			orderCount: summaryByBranch.get(b.id)?.orderCount ?? 0,
			totalRevenue: summaryByBranch.get(b.id)?.totalRevenue ?? 0,
			staff: staffRows.filter((s) => s.branchId === b.id)
		})),
		superAdmins: staffRows.filter((s) => s.role === 'admin')
	};
};
