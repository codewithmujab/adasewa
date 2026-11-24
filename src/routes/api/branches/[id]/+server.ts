import { eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { branches, type NewBranch } from '#lib/server/db/schema';
import { branchIdParamSchema, updateBranchSchema } from '#lib/schemas/branch';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const unauthorized = requireAdmin(locals);
	if (unauthorized) return unauthorized;

	const idCheck = branchIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID cabang tidak valid.', { status: 400 });
	}

	const currentUser = locals.user!;
	const isSuperAdmin = currentUser.role === 'admin';
	if (!isSuperAdmin && currentUser.branchId !== idCheck.data) {
		return apiError('Anda hanya dapat mengubah pengaturan cabang yang ditugaskan kepada Anda.', {
			status: 403
		});
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = updateBranchSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data pembaruan cabang tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const updatePayload: Partial<NewBranch> = { updatedAt: new Date() };

	if (input.code !== undefined && isSuperAdmin) updatePayload.code = input.code;
	if (input.name !== undefined) updatePayload.name = input.name;
	if (input.city !== undefined) updatePayload.city = input.city;
	if (input.address !== undefined) updatePayload.address = input.address;
	if (input.phone !== undefined) updatePayload.phone = input.phone;
	if (input.whatsapp !== undefined) updatePayload.whatsapp = input.whatsapp;
	if (input.deliveryFeeDefault !== undefined)
		updatePayload.deliveryFeeDefault = input.deliveryFeeDefault;
	if (input.operatingHours !== undefined) updatePayload.operatingHours = input.operatingHours;
	if (input.isActive !== undefined && isSuperAdmin) updatePayload.isActive = input.isActive;
	if (input.sortOrder !== undefined && isSuperAdmin) updatePayload.sortOrder = input.sortOrder;

	try {
		const [updated] = await locals.db
			.update(branches)
			.set(updatePayload)
			.where(eq(branches.id, idCheck.data))
			.returning();

		if (!updated) {
			return apiError('Cabang tidak ditemukan.', { status: 404 });
		}

		return apiSuccess(updated, {
			status: 200,
			message: `Informasi ${updated.name} berhasil diperbarui.`,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Kode cabang sudah digunakan cabang lain.', { status: 409 });
		}
		console.error(`[PATCH /api/branches/${idCheck.data}] error:`, error);
		return apiError('Gagal memperbarui cabang.', { status: 500 });
	}
};
