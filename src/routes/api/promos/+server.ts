import { desc, eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { promoCodes } from '#lib/server/db/schema';
import { createPromoSchema } from '#lib/schemas/promo';
import { getActivePublicPromos } from '#lib/server/promo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const includeInactive = url.searchParams.get('includeInactive') === 'true';
	const isAdmin = Boolean(locals.user && locals.session && locals.user.role === 'admin');

	if (includeInactive) {
		if (!isAdmin) {
			return apiError('Akses ditolak.', { status: 403 });
		}
		const all = await locals.db
			.select()
			.from(promoCodes)
			.orderBy(desc(promoCodes.createdAt))
			.limit(100);
		return apiSuccess(all, {
			status: 200,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const active = await getActivePublicPromos(locals.db, false);
	return apiSuccess(active, {
		status: 200,
		headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' }
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Hanya admin yang dapat membuat promo diskon.'
	);
	if (unauthorized) return unauthorized;

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = createPromoSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data promo diskon tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;

	const existing = await locals.db
		.select({ id: promoCodes.id })
		.from(promoCodes)
		.where(eq(promoCodes.code, input.code))
		.limit(1);

	if (existing.length > 0) {
		return apiError(`Kode promo "${input.code}" sudah terdaftar.`, {
			status: 409,
			errors: { code: ['Gunakan kode promo yang belum dipakai.'] }
		});
	}

	try {
		const [created] = await locals.db
			.insert(promoCodes)
			.values({
				code: input.code,
				title: input.title,
				description: input.description,
				discountType: input.discountType,
				discountValue: input.discountValue,
				maxDiscountAmount:
					input.discountType === 'percentage' ? (input.maxDiscountAmount ?? null) : null,
				minOrderAmount: input.minOrderAmount,
				usageLimit: input.usageLimit ?? null,
				startsAt: input.startsAt instanceof Date ? input.startsAt : null,
				expiresAt: input.expiresAt instanceof Date ? input.expiresAt : null,
				isActive: input.isActive,
				showOnLanding: input.showOnLanding
			})
			.returning();

		if (!created) {
			return apiError('Gagal menyimpan promo diskon.', { status: 500 });
		}

		return apiSuccess(created, {
			status: 201,
			message: `Promo "${created.code}" berhasil dibuat.`,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError(`Kode promo "${input.code}" sudah terdaftar.`, { status: 409 });
		}
		console.error('[POST /api/promos] Database error:', error);
		return apiError('Terjadi kesalahan internal saat membuat promo.', { status: 500 });
	}
};
