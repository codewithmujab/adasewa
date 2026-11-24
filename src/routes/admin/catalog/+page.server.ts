import { asc } from 'drizzle-orm';
import { rentalCategories, rentalItems } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [categories, items] = await Promise.all([
		locals.db
			.select()
			.from(rentalCategories)
			.orderBy(asc(rentalCategories.sortOrder), asc(rentalCategories.name)),
		locals.db
			.select()
			.from(rentalItems)
			.orderBy(asc(rentalItems.sortOrder), asc(rentalItems.name))
	]);

	return {
		categories,
		items
	};
};
