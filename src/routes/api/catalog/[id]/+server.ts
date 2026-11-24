import { and, eq, ne } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import {
	rentalCategories,
	rentalItems,
	type NewRentalItem
} from '#lib/server/db/schema';
import { deleteR2ObjectSafely } from '#lib/server/storage/r2';
import {
	rentalItemIdParamSchema,
	slugify,
	updateRentalItemSchema
} from '#lib/schemas/catalog';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const idValidation = rentalItemIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID barang tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;
	const [item] = await locals.db
		.select()
		.from(rentalItems)
		.where(eq(rentalItems.id, id))
		.limit(1);

	const isAdmin = Boolean(locals.user && locals.session);

	if (!item || (!item.isPublished && !isAdmin)) {
		return apiError('Barang katalog tidak ditemukan.', { status: 404 });
	}

	return apiSuccess(item, {
		status: 200,
		headers: {
			'Cache-Control': isAdmin
				? 'private, no-store'
				: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
		}
	});
};

export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk mengubah barang katalog.'
	);
	if (unauthorized) return unauthorized;

	const idValidation = rentalItemIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID barang tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = updateRentalItemSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi pembaruan barang gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const id = idValidation.data;
	const [existing] = await locals.db
		.select()
		.from(rentalItems)
		.where(eq(rentalItems.id, id))
		.limit(1);

	if (!existing) {
		return apiError('Barang katalog tidak ditemukan.', { status: 404 });
	}

	const input = validation.data;
	const updatePayload: Partial<NewRentalItem> = {
		updatedAt: new Date()
	};

	if (input.categoryId !== undefined) {
		const [catExists] = await locals.db
			.select({ id: rentalCategories.id })
			.from(rentalCategories)
			.where(eq(rentalCategories.id, input.categoryId))
			.limit(1);
		if (!catExists) {
			return apiError('Kategori barang tidak ditemukan.', {
				status: 422,
				errors: { categoryId: ['Pilih kategori yang valid.'] }
			});
		}
		updatePayload.categoryId = input.categoryId;
	}

	if (input.name !== undefined) updatePayload.name = input.name;

	if (input.slug !== undefined) {
		const normalizedSlug = slugify(input.slug, 200);
		if (normalizedSlug.length < 2) {
			return apiError('Slug tidak valid.', {
				status: 422,
				errors: { slug: ['Slug minimal 2 karakter valid.'] }
			});
		}

		const slugConflict = await locals.db
			.select({ id: rentalItems.id })
			.from(rentalItems)
			.where(and(eq(rentalItems.slug, normalizedSlug), ne(rentalItems.id, id)))
			.limit(1);

		if (slugConflict.length > 0) {
			return apiError('Slug barang sudah digunakan oleh unit lain.', {
				status: 409,
				errors: { slug: ['Slug ini sudah terdaftar, gunakan slug lain.'] }
			});
		}
		updatePayload.slug = normalizedSlug;
	}

	if (input.shortDescription !== undefined) updatePayload.shortDescription = input.shortDescription;
	if (input.description !== undefined) updatePayload.description = input.description;
	if (input.specs !== undefined) updatePayload.specs = input.specs;
	if (input.includes !== undefined) updatePayload.includes = input.includes;
	if (input.variants !== undefined) updatePayload.variants = input.variants;
	if (input.pricePerDay !== undefined) updatePayload.pricePerDay = input.pricePerDay;
	if (input.unitLabel !== undefined) updatePayload.unitLabel = input.unitLabel;
	if (input.minDurationDays !== undefined) updatePayload.minDurationDays = input.minDurationDays;
	if (input.stockQty !== undefined) updatePayload.stockQty = input.stockQty;
	if (input.requiresDeposit !== undefined) updatePayload.requiresDeposit = input.requiresDeposit;
	if (input.deliveryAvailable !== undefined) updatePayload.deliveryAvailable = input.deliveryAvailable;
	if (input.pickupAvailable !== undefined) updatePayload.pickupAvailable = input.pickupAvailable;
	if (input.imageKey !== undefined) updatePayload.imageKey = input.imageKey;
	if (input.imageUrl !== undefined) updatePayload.imageUrl = input.imageUrl;
	if (input.isFeatured !== undefined) updatePayload.isFeatured = input.isFeatured;
	if (input.isPublished !== undefined) updatePayload.isPublished = input.isPublished;
	if (input.sortOrder !== undefined) updatePayload.sortOrder = input.sortOrder;

	try {
		const [updated] = await locals.db
			.update(rentalItems)
			.set(updatePayload)
			.where(eq(rentalItems.id, id))
			.returning();

		if (!updated) {
			return apiError('Barang katalog tidak ditemukan.', { status: 404 });
		}

		if (
			input.imageKey !== undefined &&
			existing.imageKey &&
			existing.imageKey !== input.imageKey
		) {
			await deleteR2ObjectSafely(platform, existing.imageKey);
		}

		return apiSuccess(updated, {
			status: 200,
			message: 'Barang katalog berhasil diperbarui.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug barang sudah digunakan oleh unit lain.', { status: 409 });
		}
		console.error(`[PATCH /api/catalog/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat memperbarui barang.', { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menghapus barang katalog.'
	);
	if (unauthorized) return unauthorized;

	const idValidation = rentalItemIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID barang tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;

	try {
		const [deleted] = await locals.db
			.delete(rentalItems)
			.where(eq(rentalItems.id, id))
			.returning({
				id: rentalItems.id,
				imageKey: rentalItems.imageKey
			});

		if (!deleted) {
			return apiError('Barang katalog tidak ditemukan.', { status: 404 });
		}

		if (deleted.imageKey) {
			await deleteR2ObjectSafely(platform, deleted.imageKey);
		}

		return apiSuccess(
			{ id: deleted.id },
			{
				status: 200,
				message: 'Barang katalog berhasil dihapus.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	} catch (error: unknown) {
		console.error(`[DELETE /api/catalog/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat menghapus barang.', { status: 500 });
	}
};
