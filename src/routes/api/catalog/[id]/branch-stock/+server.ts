import { eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { branchItemStocks, branches, rentalItems } from '#lib/server/db/schema';
import { upsertBranchStockSchema } from '#lib/schemas/branch';
import { rentalItemIdParamSchema } from '#lib/schemas/catalog';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const unauthorized = requireAdmin(locals);
	if (unauthorized) return unauthorized;

	const itemIdCheck = rentalItemIdParamSchema.safeParse(params.id);
	if (!itemIdCheck.success) {
		return apiError('ID barang tidak valid.', { status: 400 });
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = upsertBranchStockSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data harga & stok cabang tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';

	if (!isSuperAdmin && currentUser.branchId !== input.branchId) {
		return apiError('Admin cabang hanya dapat mengubah harga & stok cabangnya sendiri.', {
			status: 403
		});
	}

	const [branchRow, itemRow] = await Promise.all([
		locals.db
			.select({ id: branches.id, name: branches.name })
			.from(branches)
			.where(eq(branches.id, input.branchId))
			.limit(1),
		locals.db
			.select({ id: rentalItems.id, name: rentalItems.name })
			.from(rentalItems)
			.where(eq(rentalItems.id, itemIdCheck.data))
			.limit(1)
	]);

	if (!branchRow[0]) return apiError('Cabang tidak ditemukan.', { status: 404 });
	if (!itemRow[0]) return apiError('Barang tidak ditemukan.', { status: 404 });

	const [upserted] = await locals.db
		.insert(branchItemStocks)
		.values({
			branchId: input.branchId,
			rentalItemId: itemIdCheck.data,
			pricePerDay: input.pricePerDay,
			stockQty: input.stockQty,
			isAvailable: input.isAvailable
		})
		.onConflictDoUpdate({
			target: [branchItemStocks.branchId, branchItemStocks.rentalItemId],
			set: {
				pricePerDay: input.pricePerDay,
				stockQty: input.stockQty,
				isAvailable: input.isAvailable,
				updatedAt: new Date()
			}
		})
		.returning();

	return apiSuccess(upserted, {
		status: 200,
		message: `Harga & stok "${itemRow[0].name}" untuk ${branchRow[0].name} diperbarui.`,
		headers: { 'Cache-Control': 'private, no-store' }
	});
};
