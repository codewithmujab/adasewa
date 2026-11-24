import { asc } from 'drizzle-orm';
import { getAllBranchStocksByItem } from '#lib/server/branches';
import { rentalCategories, rentalItems } from '#lib/server/db/schema';
import type { BranchStockSnapshot } from '#lib/utils/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [categories, items, stocksMap] = await Promise.all([
		locals.db
			.select()
			.from(rentalCategories)
			.orderBy(asc(rentalCategories.sortOrder), asc(rentalCategories.name)),
		locals.db
			.select()
			.from(rentalItems)
			.orderBy(asc(rentalItems.sortOrder), asc(rentalItems.name)),
		getAllBranchStocksByItem(locals.db)
	]);

	const branchStocksByItem: Record<string, Record<string, BranchStockSnapshot>> = {};
	for (const [itemId, byBranch] of stocksMap.entries()) {
		branchStocksByItem[itemId] = byBranch;
	}

	return {
		categories,
		items,
		branchStocksByItem
	};
};
