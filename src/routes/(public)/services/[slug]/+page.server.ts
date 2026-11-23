import { error } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [service] = await locals.db
		.select()
		.from(services)
		.where(and(eq(services.slug, params.slug), eq(services.isPublished, true)))
		.limit(1);

	if (!service) {
		error(404, 'Layanan yang Anda cari tidak ditemukan.');
	}

	const relatedPortfolios = await locals.db
		.select()
		.from(portfolios)
		.where(and(eq(portfolios.serviceId, service.id), eq(portfolios.isPublished, true)))
		.orderBy(asc(portfolios.sortOrder), desc(portfolios.createdAt))
		.limit(4);

	return {
		service,
		relatedPortfolios
	};
};
