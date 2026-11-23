import { asc, desc, eq } from 'drizzle-orm';
import { services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await locals.db
		.select()
		.from(services)
		.where(eq(services.isPublished, true))
		.orderBy(asc(services.sortOrder), desc(services.createdAt));

	return {
		services: items
	};
};
