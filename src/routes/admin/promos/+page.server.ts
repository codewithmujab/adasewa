import { desc, eq, isNull, or } from 'drizzle-orm';
import { promoCodes } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';

	const promos = isSuperAdmin
		? await locals.db
				.select()
				.from(promoCodes)
				.orderBy(desc(promoCodes.createdAt))
				.limit(100)
		: currentUser.branchId
			? await locals.db
					.select()
					.from(promoCodes)
					.where(or(isNull(promoCodes.branchId), eq(promoCodes.branchId, currentUser.branchId)))
					.orderBy(desc(promoCodes.createdAt))
					.limit(100)
			: [];

	return {
		promos
	};
};
