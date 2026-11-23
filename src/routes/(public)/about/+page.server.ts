import { count, eq } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [serviceCountRes, portfolioCountRes] = await Promise.all([
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
		serviceCount: Number(serviceCountRes[0]?.total ?? 0),
		portfolioCount: Number(portfolioCountRes[0]?.total ?? 0)
	};
};
