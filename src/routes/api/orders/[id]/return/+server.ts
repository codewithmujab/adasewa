import { eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAuth
} from '#lib/server/api/response';
import { rentalOrderItems, rentalOrders } from '#lib/server/db/schema';
import { customerReturnRequestSchema, orderIdParamSchema } from '#lib/schemas/order';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const unauthorized = requireAuth(locals);
	if (unauthorized) return unauthorized;

	const idCheck = orderIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID pesanan tidak valid.', { status: 400 });
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = customerReturnRequestSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data pengajuan pengembalian tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const [existing] = await locals.db
		.select()
		.from(rentalOrders)
		.where(eq(rentalOrders.id, idCheck.data))
		.limit(1);

	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';
	const isOwnBranchAdmin =
		currentUser.role === 'branch_admin' &&
		Boolean(currentUser.branchId) &&
		existing?.branchId === currentUser.branchId;

	if (!existing || (existing.userId !== currentUser.id && !isSuperAdmin && !isOwnBranchAdmin)) {
		return apiError('Pesanan tidak ditemukan.', { status: 404 });
	}

	if (existing.orderStatus === 'returned') {
		return apiError('Barang pada pesanan ini sudah berstatus dikembalikan.', { status: 400 });
	}

	if (existing.orderStatus === 'cancelled') {
		return apiError('Pesanan yang dibatalkan tidak dapat diajukan pengembalian.', { status: 400 });
	}

	const [updated] = await locals.db
		.update(rentalOrders)
		.set({
			orderStatus: 'return_requested',
			returnMethod: validation.data.returnMethod,
			returnRequestedAt: new Date(),
			returnNotes: validation.data.returnNotes?.trim() || null,
			updatedAt: new Date()
		})
		.where(eq(rentalOrders.id, existing.id))
		.returning();

	const items = await locals.db
		.select()
		.from(rentalOrderItems)
		.where(eq(rentalOrderItems.orderId, existing.id));

	return apiSuccess(
		{ ...updated, items },
		{
			status: 200,
			message: 'Pengajuan pengembalian barang berhasil dicatat. Tim kami akan memverifikasi unit saat diterima.',
			headers: { 'Cache-Control': 'private, no-store' }
		}
	);
};
