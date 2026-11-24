import { desc, eq } from 'drizzle-orm';
import { rentalOrders } from '#lib/server/db/schema';
import { getActivePublicPromos } from '#lib/server/promo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [activePromos, latestOrderRows] = await Promise.all([
		getActivePublicPromos(locals.db, false),
		locals.user && locals.session
			? locals.db
					.select({
						customerPhone: rentalOrders.customerPhone,
						emergencyPhone: rentalOrders.emergencyPhone,
						deliveryRegion: rentalOrders.deliveryRegion,
						deliveryAddress: rentalOrders.deliveryAddress
					})
					.from(rentalOrders)
					.where(eq(rentalOrders.userId, locals.user.id))
					.orderBy(desc(rentalOrders.createdAt))
					.limit(1)
			: Promise.resolve([])
	]);

	return {
		activePromos,
		lastOrderProfile: latestOrderRows[0] ?? null
	};
};
