import { asc, eq } from 'drizzle-orm';
import type { Database } from '#lib/server/db';
import {
	branchItemStocks,
	branches,
	type Branch,
	type BranchItemStock
} from '#lib/server/db/schema';

export async function getActiveBranches(db: Database): Promise<Branch[]> {
	return db
		.select()
		.from(branches)
		.where(eq(branches.isActive, true))
		.orderBy(asc(branches.sortOrder), asc(branches.name));
}

export async function getBranchStocksForBranch(
	db: Database,
	branchId: string
): Promise<Map<string, BranchItemStock>> {
	const rows = await db
		.select()
		.from(branchItemStocks)
		.where(eq(branchItemStocks.branchId, branchId));

	return new Map<string, BranchItemStock>(rows.map((r) => [r.rentalItemId, r]));
}

export async function getAllBranchStocksByItem(
	db: Database
): Promise<Map<string, Record<string, { pricePerDay: number; stockQty: number; isAvailable: boolean }>>> {
	const rows = await db.select().from(branchItemStocks);
	const map = new Map<
		string,
		Record<string, { pricePerDay: number; stockQty: number; isAvailable: boolean }>
	>();

	for (const row of rows) {
		let entry = map.get(row.rentalItemId);
		if (!entry) {
			entry = {};
			map.set(row.rentalItemId, entry);
		}
		entry[row.branchId] = {
			pricePerDay: row.pricePerDay,
			stockQty: row.stockQty,
			isAvailable: row.isAvailable
		};
	}

	return map;
}
