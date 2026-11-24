import { desc } from 'drizzle-orm';
import { pointTransactions, user } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [accounts, recentTransactions] = await Promise.all([
		locals.db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				pointBalance: user.pointBalance,
				createdAt: user.createdAt
			})
			.from(user)
			.orderBy(desc(user.pointBalance), desc(user.createdAt)),
		locals.db
			.select()
			.from(pointTransactions)
			.orderBy(desc(pointTransactions.createdAt))
			.limit(80)
	]);

	return {
		accounts,
		recentTransactions
	};
};
