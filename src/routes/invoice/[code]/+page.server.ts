import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getCompanySettings } from '#lib/server/cms/defaults';
import { rentalOrderItems, rentalOrders } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' });

	if (!locals.user || !locals.session) {
		const redirectTo = encodeURIComponent(`/invoice/${params.code}`);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const [settings, orderRows] = await Promise.all([
		getCompanySettings(locals.db),
		locals.db
			.select()
			.from(rentalOrders)
			.where(eq(rentalOrders.orderCode, params.code))
			.limit(1)
	]);

	const order = orderRows[0];
	if (!order || (order.userId !== locals.user.id && locals.user.role !== 'admin')) {
		throw error(404, 'Invoice transaksi tidak ditemukan.');
	}

	const items = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(eq(rentalOrderItems.orderId, order.id));

	return {
		settings,
		order,
		items,
		backHref: locals.user.role === 'admin' ? '/admin/orders' : `/akun/pesanan/${order.orderCode}`
	};
};
