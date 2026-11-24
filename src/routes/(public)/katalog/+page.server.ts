import { asc, desc, eq } from 'drizzle-orm';
import {
	rentalCategories,
	rentalItems,
	type RentalCategory
} from '#lib/server/db/schema';
import type { CategorySummary, RentalItemWithCategory } from '#lib/utils/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [categories, items] = await Promise.all([
		locals.db
			.select()
			.from(rentalCategories)
			.where(eq(rentalCategories.isPublished, true))
			.orderBy(asc(rentalCategories.sortOrder), asc(rentalCategories.name)),
		locals.db
			.select()
			.from(rentalItems)
			.where(eq(rentalItems.isPublished, true))
			.orderBy(asc(rentalItems.sortOrder), desc(rentalItems.isFeatured), asc(rentalItems.name))
	]);

	const categoryById = new Map<string, RentalCategory>(categories.map((cat) => [cat.id, cat]));
	const countByCategory = new Map<string, number>();

	const catalogItems: RentalItemWithCategory[] = [];
	for (const item of items) {
		const category = categoryById.get(item.categoryId);
		if (!category) continue;
		countByCategory.set(category.id, (countByCategory.get(category.id) ?? 0) + 1);
		catalogItems.push({ ...item, category });
	}

	const categorySummaries: CategorySummary[] = categories.map((cat) => ({
		...cat,
		itemCount: countByCategory.get(cat.id) ?? 0,
		previewItems: []
	}));

	return {
		categories: categorySummaries,
		items: catalogItems,
		initialQuery: url.searchParams.get('q') ?? '',
		initialCategory: url.searchParams.get('kategori') ?? 'all'
	};
};
