import { asc, count, desc, eq } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [featuredServices, featuredPortfolios, serviceCountRes, portfolioCountRes] =
		await Promise.all([
			locals.db
				.select()
				.from(services)
				.where(eq(services.isPublished, true))
				.orderBy(desc(services.isFeatured), asc(services.sortOrder), desc(services.createdAt))
				.limit(6),
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
			locals.db
				.select({ total: count() })
				.from(services)
				.where(eq(services.isPublished, true)),
			locals.db
				.select({ total: count() })
				.from(portfolios)
				.where(eq(portfolios.isPublished, true))
		]);

	return {
		featuredServices,
		featuredPortfolios,
		serviceCount: Number(serviceCountRes[0]?.total ?? 0),
		portfolioCount: Number(portfolioCountRes[0]?.total ?? 0)
	};
};
