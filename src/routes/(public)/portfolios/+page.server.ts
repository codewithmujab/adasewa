import { asc, desc, eq } from 'drizzle-orm';
import { portfolios } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await locals.db
		.select()
		.from(portfolios)
		.where(eq(portfolios.isPublished, true))
		.orderBy(asc(portfolios.sortOrder), desc(portfolios.completedAt), desc(portfolios.createdAt));

	return {
		portfolios: items
	};
};
