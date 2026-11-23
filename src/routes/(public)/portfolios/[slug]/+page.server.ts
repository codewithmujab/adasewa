import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { portfolios, services } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [portfolio] = await locals.db
		.select()
		.from(portfolios)
		.where(and(eq(portfolios.slug, params.slug), eq(portfolios.isPublished, true)))
		.limit(1);

	if (!portfolio) {
		error(404, 'Portofolio yang Anda cari tidak ditemukan.');
	}

	let relatedService = null;
	if (portfolio.serviceId) {
		const [svc] = await locals.db
			.select()
			.from(services)
			.where(and(eq(services.id, portfolio.serviceId), eq(services.isPublished, true)))
			.limit(1);
		relatedService = svc ?? null;
	}

	return {
		portfolio,
		relatedService
	};
};
