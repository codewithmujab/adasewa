import { count, desc, eq } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [
		totalServicesRes,
		publishedServicesRes,
		totalPortfoliosRes,
		publishedPortfoliosRes,
		recentServices,
		recentPortfolios
	] = await Promise.all([
		locals.db.select({ total: count() }).from(services),
		locals.db
			.select({ total: count() })
			.from(services)
			.where(eq(services.isPublished, true)),
		locals.db.select({ total: count() }).from(portfolios),
		locals.db
			.select({ total: count() })
			.from(portfolios)
			.where(eq(portfolios.isPublished, true)),
		locals.db.select().from(services).orderBy(desc(services.updatedAt)).limit(5),
		locals.db.select().from(portfolios).orderBy(desc(portfolios.updatedAt)).limit(5)
	]);

	const totalServices = Number(totalServicesRes[0]?.total ?? 0);
	const publishedServices = Number(publishedServicesRes[0]?.total ?? 0);
	const totalPortfolios = Number(totalPortfoliosRes[0]?.total ?? 0);
	const publishedPortfolios = Number(publishedPortfoliosRes[0]?.total ?? 0);

	return {
		stats: {
			totalServices,
			publishedServices,
			draftServices: totalServices - publishedServices,
			totalPortfolios,
			publishedPortfolios,
			draftPortfolios: totalPortfolios - publishedPortfolios
		},
		recentServices,
		recentPortfolios
	};
};
