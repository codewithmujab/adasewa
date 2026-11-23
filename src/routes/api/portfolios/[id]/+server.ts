import { and, eq, ne } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { portfolios, services, type NewPortfolio } from '#lib/server/db/schema';
import { deleteR2ObjectsSafely } from '#lib/server/storage/r2';
import { portfolioIdParamSchema, slugify, updatePortfolioSchema } from '#lib/schemas/portfolio';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const idValidation = portfolioIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID portofolio tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;
	const [portfolio] = await locals.db
		.select()
		.from(portfolios)
		.where(eq(portfolios.id, id))
		.limit(1);

	const isAdmin = Boolean(locals.user && locals.session);

	if (!portfolio || (!portfolio.isPublished && !isAdmin)) {
		return apiError('Portofolio tidak ditemukan.', { status: 404 });
	}

	return apiSuccess(portfolio, {
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
		'Unauthorized. Anda harus login untuk mengubah portofolio.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const idValidation = portfolioIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID portofolio tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) {
		return parsedBody.response;
	}

	const validation = updatePortfolioSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi pembaruan portofolio gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const id = idValidation.data;
	const [existing] = await locals.db
		.select()
		.from(portfolios)
		.where(eq(portfolios.id, id))
		.limit(1);

	if (!existing) {
		return apiError('Portofolio tidak ditemukan.', { status: 404 });
	}

	const input = validation.data;
	const updatePayload: Partial<NewPortfolio> = {
		updatedAt: new Date()
	};

	if (input.title !== undefined) {
		updatePayload.title = input.title;
	}

	if (input.slug !== undefined) {
		const normalizedSlug = slugify(input.slug, 200);
		if (normalizedSlug.length < 2) {
			return apiError('Slug tidak valid.', {
				status: 422,
				errors: { slug: ['Slug minimal 2 karakter valid.'] }
			});
		}

		const slugConflict = await locals.db
			.select({ id: portfolios.id })
			.from(portfolios)
			.where(and(eq(portfolios.slug, normalizedSlug), ne(portfolios.id, id)))
			.limit(1);

		if (slugConflict.length > 0) {
			return apiError('Slug portofolio sudah digunakan oleh portofolio lain.', {
				status: 409,
				errors: { slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.'] }
			});
		}

		updatePayload.slug = normalizedSlug;
	}

	if (input.serviceId !== undefined) {
		if (input.serviceId !== null) {
			const [linkedService] = await locals.db
				.select({ id: services.id })
				.from(services)
				.where(eq(services.id, input.serviceId))
				.limit(1);

			if (!linkedService) {
				return apiError('Layanan terkait tidak ditemukan.', {
					status: 422,
					errors: { serviceId: ['Layanan yang dipilih tidak ditemukan di database.'] }
				});
			}
		}
		updatePayload.serviceId = input.serviceId;
	}

	if (input.clientName !== undefined) updatePayload.clientName = input.clientName;
	if (input.category !== undefined) updatePayload.category = input.category;
	if (input.summary !== undefined) updatePayload.summary = input.summary;
	if (input.content !== undefined) updatePayload.content = input.content;
	if (input.projectUrl !== undefined) updatePayload.projectUrl = input.projectUrl;
	if (input.completedAt !== undefined) updatePayload.completedAt = input.completedAt;
	if (input.imageKey !== undefined) updatePayload.imageKey = input.imageKey;
	if (input.imageUrl !== undefined) updatePayload.imageUrl = input.imageUrl;
	if (input.gallery !== undefined) updatePayload.gallery = input.gallery;
	if (input.isFeatured !== undefined) updatePayload.isFeatured = input.isFeatured;
	if (input.isPublished !== undefined) updatePayload.isPublished = input.isPublished;
	if (input.sortOrder !== undefined) updatePayload.sortOrder = input.sortOrder;

	try {
		const [updated] = await locals.db
			.update(portfolios)
			.set(updatePayload)
			.where(eq(portfolios.id, id))
			.returning();

		if (!updated) {
			return apiError('Portofolio tidak ditemukan.', { status: 404 });
		}

		// Kumpulkan key R2 lama yang tidak lagi direferensikan
		const obsoleteKeys: string[] = [];

		if (
			input.imageKey !== undefined &&
			existing.imageKey &&
			existing.imageKey !== input.imageKey
		) {
			obsoleteKeys.push(existing.imageKey);
		}

		if (input.gallery !== undefined) {
			const nextGalleryKeys = new Set(input.gallery.map((item) => item.imageKey));
			for (const oldItem of existing.gallery) {
				if (oldItem.imageKey && !nextGalleryKeys.has(oldItem.imageKey)) {
					obsoleteKeys.push(oldItem.imageKey);
				}
			}
		}

		if (obsoleteKeys.length > 0) {
			await deleteR2ObjectsSafely(platform, obsoleteKeys);
		}

		return apiSuccess(updated, {
			status: 200,
			message: 'Portofolio berhasil diperbarui.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug portofolio sudah digunakan oleh portofolio lain.', {
				status: 409,
				errors: { slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.'] }
			});
		}

		console.error(`[PATCH /api/portfolios/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat memperbarui portofolio.', { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menghapus portofolio.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const idValidation = portfolioIdParamSchema.safeParse(params.id);
	if (!idValidation.success) {
		return apiError('ID portofolio tidak valid.', {
			status: 400,
			errors: formatZodErrors(idValidation.error)
		});
	}

	const id = idValidation.data;

	try {
		const [deleted] = await locals.db
			.delete(portfolios)
			.where(eq(portfolios.id, id))
			.returning({
				id: portfolios.id,
				imageKey: portfolios.imageKey,
				gallery: portfolios.gallery
			});

		if (!deleted) {
			return apiError('Portofolio tidak ditemukan.', { status: 404 });
		}

		const keysToDelete: Array<string | null | undefined> = [
			deleted.imageKey,
			...deleted.gallery.map((item) => item.imageKey)
		];

		await deleteR2ObjectsSafely(platform, keysToDelete);

		return apiSuccess(
			{ id: deleted.id },
			{
				status: 200,
				message: 'Portofolio berhasil dihapus.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	} catch (error: unknown) {
		console.error(`[DELETE /api/portfolios/${id}] Database error:`, error);
		return apiError('Terjadi kesalahan internal saat menghapus portofolio.', { status: 500 });
	}
};
