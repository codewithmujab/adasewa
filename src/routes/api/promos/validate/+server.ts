import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody
} from '#lib/server/api/response';
import { validatePromoSchema } from '#lib/schemas/promo';
import { validatePromoForSubtotal } from '#lib/server/promo';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = validatePromoSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Kode promo atau nominal sewa tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const check = await validatePromoForSubtotal(
		locals.db,
		validation.data.code,
		validation.data.subtotalAmount
	);

	if (!check.ok) {
		return apiError(check.message, {
			status: 422,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	return apiSuccess(
		{
			promo: {
				id: check.promo.id,
				code: check.promo.code,
				title: check.promo.title,
				discountType: check.promo.discountType,
				discountValue: check.promo.discountValue,
				maxDiscountAmount: check.promo.maxDiscountAmount,
				minOrderAmount: check.promo.minOrderAmount
			},
			discountAmount: check.discountAmount
		},
		{
			status: 200,
			message: `Kode promo ${check.promo.code} berhasil diterapkan!`,
			headers: { 'Cache-Control': 'private, no-store' }
		}
	);
};
