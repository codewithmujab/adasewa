import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	escapeLikePattern,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { portfolios, services, type Portfolio } from '#lib/server/db/schema';
import { createPortfolioSchema, portfolioListQuerySchema, slugify } from '#lib/schemas/portfolio';
import type { PaginatedData } from '#lib/types/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const rawQuery = {
		page: url.searchParams.get('page') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		category: url.searchParams.get('category') ?? undefined,
		serviceId: url.searchParams.get('serviceId') ?? undefined,
		featured: url.searchParams.get('featured') ?? undefined,
		includeUnpublished: url.searchParams.get('includeUnpublished') ?? undefined
	};

	const parsedQuery = portfolioListQuerySchema.safeParse(rawQuery);
	if (!parsedQuery.success) {
		return apiError('Parameter query tidak valid.', {
			status: 400,
			errors: formatZodErrors(parsedQuery.error)
		});
	}

	const { page, limit, search, category, serviceId, featured, includeUnpublished } =
		parsedQuery.data;
	const isAdmin = Boolean(locals.user && locals.session);

	if (includeUnpublished && !isAdmin) {
		return apiError('Akses ditolak. Login diperlukan untuk melihat portofolio draft.', {
			status: 401,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const conditions: SQL[] = [];

	if (!includeUnpublished) {
		conditions.push(eq(portfolios.isPublished, true));
	}

	if (featured !== undefined) {
		conditions.push(eq(portfolios.isFeatured, featured));
	}

	if (category && category.length > 0) {
		conditions.push(eq(portfolios.category, category));
	}

	if (serviceId) {
		conditions.push(eq(portfolios.serviceId, serviceId));
	}

	if (search && search.length > 0) {
		const pattern = `%${escapeLikePattern(search)}%`;
		const searchCondition = or(
			ilike(portfolios.title, pattern),
			ilike(portfolios.clientName, pattern),
			ilike(portfolios.category, pattern),
			ilike(portfolios.summary, pattern),
			ilike(portfolios.slug, pattern)
		);
		if (searchCondition) {
			conditions.push(searchCondition);
		}
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * limit;

	const [items, totalResult] = await Promise.all([
		locals.db
			.select()
			.from(portfolios)
			.where(whereClause)
			.orderBy(asc(portfolios.sortOrder), desc(portfolios.completedAt), desc(portfolios.createdAt))
			.limit(limit)
			.offset(offset),
		locals.db.select({ total: count() }).from(portfolios).where(whereClause)
	]);

	const total = Number(totalResult[0]?.total ?? 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

	const payload: PaginatedData<Portfolio> = {
		items,
		meta: {
			page,
			limit,
			total,
			totalPages
		}
	};

	const cacheControl =
		isAdmin || includeUnpublished
			? 'private, no-store'
			: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

	return apiSuccess(payload, {
		status: 200,
		headers: { 'Cache-Control': cacheControl }
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menambahkan portofolio.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) {
		return parsedBody.response;
	}

	const validation = createPortfolioSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi data portofolio gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const resolvedSlug = input.slug ? slugify(input.slug, 200) : slugify(input.title, 200);

	if (resolvedSlug.length < 2) {
		return apiError('Slug portofolio tidak dapat dibuat dari judul yang diberikan.', {
			status: 422,
			errors: {
				slug: ['Silakan masukkan slug yang valid secara manual (minimal 2 karakter).']
			}
		});
	}

	const existingSlug = await locals.db
		.select({ id: portfolios.id })
		.from(portfolios)
		.where(eq(portfolios.slug, resolvedSlug))
		.limit(1);

	if (existingSlug.length > 0) {
		return apiError('Slug portofolio sudah digunakan.', {
			status: 409,
			errors: {
				slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.']
			}
		});
	}

	if (input.serviceId) {
		const [linkedService] = await locals.db
			.select({ id: services.id })
			.from(services)
			.where(eq(services.id, input.serviceId))
			.limit(1);

		if (!linkedService) {
			return apiError('Layanan terkait tidak ditemukan.', {
				status: 422,
				errors: {
					serviceId: ['Layanan yang dipilih tidak ditemukan di database.']
				}
			});
		}
	}

	try {
		const [created] = await locals.db
			.insert(portfolios)
			.values({
				title: input.title,
				slug: resolvedSlug,
				clientName: input.clientName,
				category: input.category,
				summary: input.summary,
				content: input.content,
				projectUrl: input.projectUrl ?? null,
				completedAt: input.completedAt ?? null,
				imageKey: input.imageKey ?? null,
				imageUrl: input.imageUrl ?? null,
				gallery: input.gallery,
				serviceId: input.serviceId ?? null,
				isFeatured: input.isFeatured,
				isPublished: input.isPublished,
				sortOrder: input.sortOrder
			})
			.returning();

		if (!created) {
			return apiError('Gagal menyimpan data portofolio.', { status: 500 });
		}

		return apiSuccess(created, {
			status: 201,
			message: 'Portofolio berhasil ditambahkan.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug portofolio sudah digunakan.', {
				status: 409,
				errors: {
					slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.']
				}
			});
		}

		console.error('[POST /api/portfolios] Database error:', error);
		return apiError('Terjadi kesalahan internal saat menyimpan portofolio.', { status: 500 });
	}
};
