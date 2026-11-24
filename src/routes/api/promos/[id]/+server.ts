import { and, eq, ne } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { promoCodes, type NewPromoCode } from '#lib/server/db/schema';
import { promoIdParamSchema, updatePromoSchema } from '#lib/schemas/promo';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const unauthorized = requireAdmin(locals);
	if (unauthorized) return unauthorized;

	const idCheck = promoIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID promo tidak valid.', { status: 400 });
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = updatePromoSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi pembaruan promo gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const id = idCheck.data;
	const [existing] = await locals.db
		.select()
		.from(promoCodes)
		.where(eq(promoCodes.id, id))
		.limit(1);

	if (!existing) {
		return apiError('Promo diskon tidak ditemukan.', { status: 404 });
	}

	const input = validation.data;
	const updatePayload: Partial<NewPromoCode> = {
		updatedAt: new Date()
	};

	if (input.code !== undefined) {
		const conflict = await locals.db
			.select({ id: promoCodes.id })
			.from(promoCodes)
			.where(and(eq(promoCodes.code, input.code), ne(promoCodes.id, id)))
			.limit(1);
		if (conflict.length > 0) {
			return apiError(`Kode promo "${input.code}" sudah dipakai promo lain.`, { status: 409 });
		}
		updatePayload.code = input.code;
	}

	if (input.title !== undefined) updatePayload.title = input.title;
	if (input.description !== undefined) updatePayload.description = input.description;
	if (input.discountType !== undefined) updatePayload.discountType = input.discountType;
	if (input.discountValue !== undefined) updatePayload.discountValue = input.discountValue;
	if (input.maxDiscountAmount !== undefined) updatePayload.maxDiscountAmount = input.maxDiscountAmount;
	if (input.minOrderAmount !== undefined) updatePayload.minOrderAmount = input.minOrderAmount;
	if (input.usageLimit !== undefined) updatePayload.usageLimit = input.usageLimit;
	if (input.startsAt !== undefined) {
		updatePayload.startsAt = input.startsAt instanceof Date ? input.startsAt : null;
	}
	if (input.expiresAt !== undefined) {
		updatePayload.expiresAt = input.expiresAt instanceof Date ? input.expiresAt : null;
	}
	if (input.isActive !== undefined) updatePayload.isActive = input.isActive;
	if (input.showOnLanding !== undefined) updatePayload.showOnLanding = input.showOnLanding;

	try {
		const [updated] = await locals.db
			.update(promoCodes)
			.set(updatePayload)
			.where(eq(promoCodes.id, id))
			.returning();

		if (!updated) {
			return apiError('Promo diskon tidak ditemukan.', { status: 404 });
		}

		return apiSuccess(updated, {
			status: 200,
			message: `Promo "${updated.code}" berhasil diperbarui.`,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Kode promo sudah dipakai promo lain.', { status: 409 });
		}
		console.error(`[PATCH /api/promos/${id}] Database error:`, error);
		return apiError('Gagal memperbarui promo diskon.', { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const unauthorized = requireAdmin(locals);
	if (unauthorized) return unauthorized;

	const idCheck = promoIdParamSchema.safeParse(params.id);
	if (!idCheck.success) {
		return apiError('ID promo tidak valid.', { status: 400 });
	}

	const [deleted] = await locals.db
		.delete(promoCodes)
		.where(eq(promoCodes.id, idCheck.data))
		.returning({ id: promoCodes.id, code: promoCodes.code });

	if (!deleted) {
		return apiError('Promo diskon tidak ditemukan.', { status: 404 });
	}

	return apiSuccess(
		{ id: deleted.id },
		{
			status: 200,
			message: `Promo "${deleted.code}" berhasil dihapus.`,
			headers: { 'Cache-Control': 'private, no-store' }
		}
	);
};
