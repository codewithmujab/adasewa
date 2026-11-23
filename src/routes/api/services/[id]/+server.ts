import { and, eq, ne } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { services, type NewService } from '#lib/server/db/schema';
import { deleteR2ObjectSafely } from '#lib/server/storage/r2';
import { serviceIdParamSchema, slugify, updateServiceSchema } from '#lib/schemas/service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const idValidation = serviceIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID layanan tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;
	const [service] = await locals.db
		.select()
		.from(services)
		.where(eq(services.id, id))
		.limit(1);

	const isAdmin = Boolean(locals.user && locals.session);

	if (!service || (!service.isPublished && !isAdmin)) {
		return apiError('Layanan tidak ditemukan.', { status: 404 });
	}

	return apiSuccess(service, {
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
		'Unauthorized. Anda harus login untuk mengubah layanan.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const idValidation = serviceIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID layanan tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) {
		return parsedBody.response;
	}

	const validation = updateServiceSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi pembaruan layanan gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const id = idValidation.data;
	const [existing] = await locals.db
		.select()
		.from(services)
		.where(eq(services.id, id))
		.limit(1);

	if (!existing) {
		return apiError('Layanan tidak ditemukan.', { status: 404 });
	}

	const input = validation.data;
	const updatePayload: Partial<NewService> = {
		updatedAt: new Date()
	};

	if (input.title !== undefined) {
		updatePayload.title = input.title;
	}

	if (input.slug !== undefined) {
		const normalizedSlug = slugify(input.slug);
		if (normalizedSlug.length < 2) {
			return apiError('Slug tidak valid.', {
				status: 422,
				errors: { slug: ['Slug minimal 2 karakter valid.'] }
			});
		}

		const slugConflict = await locals.db
			.select({ id: services.id })
			.from(services)
			.where(and(eq(services.slug, normalizedSlug), ne(services.id, id)))
			.limit(1);

		if (slugConflict.length > 0) {
			return apiError('Slug layanan sudah digunakan oleh layanan lain.', {
				status: 409,
				errors: { slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.'] }
			});
		}

		updatePayload.slug = normalizedSlug;
	}

	if (input.shortDescription !== undefined) {
		updatePayload.shortDescription = input.shortDescription;
	}

	if (input.description !== undefined) {
		updatePayload.description = input.description;
	}

	if (input.icon !== undefined) {
		updatePayload.icon = input.icon;
	}

	if (input.imageKey !== undefined) {
		updatePayload.imageKey = input.imageKey;
	}

	if (input.imageUrl !== undefined) {
		updatePayload.imageUrl = input.imageUrl;
	}

	if (input.isFeatured !== undefined) {
		updatePayload.isFeatured = input.isFeatured;
	}

	if (input.isPublished !== undefined) {
		updatePayload.isPublished = input.isPublished;
	}

	if (input.sortOrder !== undefined) {
		updatePayload.sortOrder = input.sortOrder;
	}

	try {
		const [updated] = await locals.db
			.update(services)
			.set(updatePayload)
			.where(eq(services.id, id))
			.returning();

		if (!updated) {
			return apiError('Layanan tidak ditemukan.', { status: 404 });
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
			message: 'Layanan berhasil diperbarui.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug layanan sudah digunakan oleh layanan lain.', {
				status: 409,
				errors: { slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.'] }
			});
		}

		console.error(`[PATCH /api/services/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat memperbarui layanan.', { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menghapus layanan.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const idValidation = serviceIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID layanan tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;

	try {
		const [deleted] = await locals.db
			.delete(services)
			.where(eq(services.id, id))
			.returning({
				id: services.id,
				imageKey: services.imageKey
			});

		if (!deleted) {
			return apiError('Layanan tidak ditemukan.', { status: 404 });
		}

		if (deleted.imageKey) {
			await deleteR2ObjectSafely(platform, deleted.imageKey);
		}

		return apiSuccess(
			{ id: deleted.id },
			{
				status: 200,
				message: 'Layanan berhasil dihapus.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	} catch (error: unknown) {
		console.error(`[DELETE /api/services/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat menghapus layanan.', { status: 500 });
	}
};
