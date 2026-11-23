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
import { services, type Service } from '#lib/server/db/schema';
import { createServiceSchema, serviceListQuerySchema, slugify } from '#lib/schemas/service';
import type { PaginatedData } from '#lib/types/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const rawQuery = {
		page: url.searchParams.get('page') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		featured: url.searchParams.get('featured') ?? undefined,
		includeUnpublished: url.searchParams.get('includeUnpublished') ?? undefined
	};

	const parsedQuery = serviceListQuerySchema.safeParse(rawQuery);
	if (!parsedQuery.success) {
		return apiError('Parameter query tidak valid.', {
			status: 400,
			errors: formatZodErrors(parsedQuery.error)
		});
	}

	const { page, limit, search, featured, includeUnpublished } = parsedQuery.data;
	const isAdmin = Boolean(locals.user && locals.session);

	if (includeUnpublished && !isAdmin) {
		return apiError('Akses ditolak. Login diperlukan untuk melihat layanan draft.', {
			status: 401,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const conditions: SQL[] = [];

	if (!includeUnpublished) {
		conditions.push(eq(services.isPublished, true));
	}

	if (featured !== undefined) {
		conditions.push(eq(services.isFeatured, featured));
	}

	if (search && search.length > 0) {
		const pattern = `%${escapeLikePattern(search)}%`;
		const searchCondition = or(
			ilike(services.title, pattern),
			ilike(services.shortDescription, pattern),
			ilike(services.slug, pattern)
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
			.from(services)
			.where(whereClause)
			.orderBy(asc(services.sortOrder), desc(services.createdAt))
			.limit(limit)
			.offset(offset),
		locals.db.select({ total: count() }).from(services).where(whereClause)
	]);

	const total = Number(totalResult[0]?.total ?? 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

	const payload: PaginatedData<Service> = {
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
		headers: {
			'Cache-Control': cacheControl
		}
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menambahkan layanan.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) {
		return parsedBody.response;
	}

	const validation = createServiceSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi data layanan gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const resolvedSlug = input.slug ? slugify(input.slug) : slugify(input.title);

	if (resolvedSlug.length < 2) {
		return apiError('Slug layanan tidak dapat dibuat dari judul yang diberikan.', {
			status: 422,
			errors: {
				slug: ['Silakan masukkan slug yang valid secara manual (minimal 2 karakter).']
			}
		});
	}

	const existingSlug = await locals.db
		.select({ id: services.id })
		.from(services)
		.where(eq(services.slug, resolvedSlug))
		.limit(1);

	if (existingSlug.length > 0) {
		return apiError('Slug layanan sudah digunakan.', {
			status: 409,
			errors: {
				slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.']
			}
		});
	}

	try {
		const [created] = await locals.db
			.insert(services)
			.values({
				title: input.title,
				slug: resolvedSlug,
				shortDescription: input.shortDescription,
				description: input.description,
				icon: input.icon ?? null,
				imageKey: input.imageKey ?? null,
				imageUrl: input.imageUrl ?? null,
				isFeatured: input.isFeatured,
				isPublished: input.isPublished,
				sortOrder: input.sortOrder
			})
			.returning();

		if (!created) {
			return apiError('Gagal menyimpan data layanan.', { status: 500 });
		}

		return apiSuccess(created, {
			status: 201,
			message: 'Layanan berhasil ditambahkan.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug layanan sudah digunakan.', {
				status: 409,
				errors: {
					slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.']
				}
			});
		}

		console.error('[POST /api/services] Database error:', error);
		return apiError('Terjadi kesalahan internal saat menyimpan layanan.', { status: 500 });
	}
};
