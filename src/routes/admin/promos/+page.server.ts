import { desc } from 'drizzle-orm';
import { promoCodes } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const promos = await locals.db
		.select()
		.from(promoCodes)
		.orderBy(desc(promoCodes.createdAt))
		.limit(100);

	return {
		promos
	};
};
