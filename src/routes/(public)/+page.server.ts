import { asc, desc, eq } from 'drizzle-orm';
import {
	portfolios,
	rentalCategories,
	rentalItems,
	type RentalCategory,
	type RentalItem
} from '#lib/server/db/schema';
import { getActivePublicPromos } from '#lib/server/promo';
import type { CategorySummary, RentalItemWithCategory } from '#lib/utils/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [categories, allPublishedItems, featuredPortfolios, activePromos] = await Promise.all([
		locals.db
			.select()
			.from(rentalCategories)
			.where(eq(rentalCategories.isPublished, true))
			.orderBy(asc(rentalCategories.sortOrder), asc(rentalCategories.name)),
		locals.db
			.select()
			.from(rentalItems)
			.where(eq(rentalItems.isPublished, true))
			.orderBy(desc(rentalItems.isFeatured), asc(rentalItems.sortOrder), asc(rentalItems.name)),
		locals.db
			.select()
			.from(portfolios)
			.where(eq(portfolios.isPublished, true))
			.orderBy(
				desc(portfolios.isFeatured),
				asc(portfolios.sortOrder),
				desc(portfolios.completedAt),
				desc(portfolios.createdAt)
			)
			.limit(4),
		getActivePublicPromos(locals.db, true)
	]);

	const categoryById = new Map<string, RentalCategory>(categories.map((c) => [c.id, c]));

	const itemsByCategory = new Map<string, RentalItem[]>();
	for (const item of allPublishedItems) {
		const list = itemsByCategory.get(item.categoryId);
		if (list) {
			list.push(item);
		} else {
			itemsByCategory.set(item.categoryId, [item]);
		}
	}

	const categorySummaries: CategorySummary[] = categories.map((cat) => {
		const catItems = itemsByCategory.get(cat.id) ?? [];
		return {
			...cat,
			itemCount: catItems.length,
			previewItems: catItems.slice(0, 3).map((item) => item.name)
		};
	});

	// Kumpulkan item unggulan + maksimal 6 item per kategori agar filter tab di landing page selalu kaya data
	const showcaseIds = new Set<string>();
	const showcaseItems: RentalItemWithCategory[] = [];

	const pushWithCategory = (item: RentalItem) => {
		if (showcaseIds.has(item.id)) return;
		const category = categoryById.get(item.categoryId);
		if (!category) return;
		showcaseIds.add(item.id);
		showcaseItems.push({ ...item, category });
	};

	for (const item of allPublishedItems) {
		if (item.isFeatured) {
			pushWithCategory(item);
		}
	}

	for (const cat of categories) {
		const catItems = itemsByCategory.get(cat.id) ?? [];
		for (const item of catItems.slice(0, 6)) {
			pushWithCategory(item);
		}
	}

	return {
		categories: categorySummaries,
		showcaseItems,
		totalItems: allPublishedItems.length,
		totalCategories: categories.length,
		featuredPortfolios,
		activePromos
	};
};
