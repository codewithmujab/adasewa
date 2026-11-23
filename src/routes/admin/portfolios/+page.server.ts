import { asc, desc } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [portfolioItems, serviceItems] = await Promise.all([
		locals.db
			.select()
			.from(portfolios)
			.orderBy(asc(portfolios.sortOrder), desc(portfolios.completedAt), desc(portfolios.createdAt)),
		locals.db
			.select()
			.from(services)
			.orderBy(asc(services.sortOrder), asc(services.title))
	]);

	return {
		portfolios: portfolioItems,
		services: serviceItems
	};
};
