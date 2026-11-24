import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { branchItemStocks, rentalCategories, rentalItems } from '#lib/server/db/schema';
import type { BranchStockSnapshot, RentalItemWithCategory } from '#lib/utils/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await locals.db
		.select()
		.from(rentalItems)
		.where(and(eq(rentalItems.slug, params.slug), eq(rentalItems.isPublished, true)))
		.limit(1);

	if (!item) {
		throw error(404, 'Barang yang Anda cari tidak ditemukan di katalog.');
	}

	const [categoryRows, relatedRows] = await Promise.all([
		locals.db
			.select()
			.from(rentalCategories)
			.where(eq(rentalCategories.id, item.categoryId))
			.limit(1),
		locals.db
			.select()
			.from(rentalItems)
			.where(
				and(
					eq(rentalItems.categoryId, item.categoryId),
					eq(rentalItems.isPublished, true),
					ne(rentalItems.id, item.id)
				)
			)
			.orderBy(desc(rentalItems.isFeatured), asc(rentalItems.sortOrder))
			.limit(4)
	]);

	const category = categoryRows[0];
	if (!category) {
		throw error(404, 'Kategori barang tidak ditemukan.');
	}

	const targetIds = [item.id, ...relatedRows.map((r) => r.id)];
	const stockRows = await locals.db
		.select()
		.from(branchItemStocks)
		.where(inArray(branchItemStocks.rentalItemId, targetIds));

	const stocksByItem = new Map<string, Record<string, BranchStockSnapshot>>();
	for (const row of stockRows) {
		let entry = stocksByItem.get(row.rentalItemId);
		if (!entry) {
			entry = {};
			stocksByItem.set(row.rentalItemId, entry);
		}
		entry[row.branchId] = {
			pricePerDay: row.pricePerDay,
			stockQty: row.stockQty,
			isAvailable: row.isAvailable
		};
	}

	const relatedItems: RentalItemWithCategory[] = relatedRows.map((row) => ({
		...row,
		category,
		branchStocks: stocksByItem.get(row.id)
	}));

	return {
		item: {
			...item,
			category,
			branchStocks: stocksByItem.get(item.id)
		} as RentalItemWithCategory,
		relatedItems
	};
};
