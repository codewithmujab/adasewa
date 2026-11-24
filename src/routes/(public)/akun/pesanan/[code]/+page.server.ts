import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { rentalOrderItems, rentalOrders } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !locals.session) {
		const redirectTo = encodeURIComponent(`/akun/pesanan/${params.code}`);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const [order] = await locals.db
		.select()
		.from(rentalOrders)
		.where(eq(rentalOrders.orderCode, params.code))
		.limit(1);

	const isSuperAdmin = locals.user.role === 'admin';
	const isOwnBranchAdmin =
		locals.user.role === 'branch_admin' &&
		Boolean(locals.user.branchId) &&
		order?.branchId === locals.user.branchId;

	if (!order || (order.userId !== locals.user.id && !isSuperAdmin && !isOwnBranchAdmin)) {
		throw error(404, 'Transaksi pesanan tidak ditemukan.');
	}

	const items = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(eq(rentalOrderItems.orderId, order.id));

	return {
		order,
		items,
		isAdmin: isSuperAdmin || isOwnBranchAdmin
	};
};
