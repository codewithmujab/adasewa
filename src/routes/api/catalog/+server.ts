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
import {
	rentalCategories,
	rentalItems,
	type RentalItem
} from '#lib/server/db/schema';
import {
	catalogListQuerySchema,
	createRentalItemSchema,
	slugify
} from '#lib/schemas/catalog';
import type { PaginatedData } from '#lib/types/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const rawQuery = {
		page: url.searchParams.get('page') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		category: url.searchParams.get('category') ?? undefined,
		featured: url.searchParams.get('featured') ?? undefined,
		includeUnpublished: url.searchParams.get('includeUnpublished') ?? undefined
	};

	const parsedQuery = catalogListQuerySchema.safeParse(rawQuery);
	if (!parsedQuery.success) {
		return apiError('Parameter query katalog tidak valid.', {
			status: 400,
			errors: formatZodErrors(parsedQuery.error)
		});
	}

	const { page, limit, search, category, featured, includeUnpublished } = parsedQuery.data;
	const isAdmin = Boolean(locals.user && locals.session);

	if (includeUnpublished && !isAdmin) {
		return apiError('Akses ditolak. Login diperlukan untuk melihat barang draft.', {
			status: 401,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const conditions: SQL[] = [];

	if (!includeUnpublished) {
		conditions.push(eq(rentalItems.isPublished, true));
	}

	if (featured !== undefined) {
		conditions.push(eq(rentalItems.isFeatured, featured));
	}

	if (category && category.length > 0) {
		const [catRow] = await locals.db
			.select({ id: rentalCategories.id })
			.from(rentalCategories)
			.where(eq(rentalCategories.slug, category))
			.limit(1);

		if (!catRow) {
			const emptyPayload: PaginatedData<RentalItem> = {
				items: [],
				meta: { page, limit, total: 0, totalPages: 0 }
			};
			return apiSuccess(emptyPayload, { status: 200 });
		}

		conditions.push(eq(rentalItems.categoryId, catRow.id));
	}

	if (search && search.length > 0) {
		const pattern = `%${escapeLikePattern(search)}%`;
		const searchCondition = or(
			ilike(rentalItems.name, pattern),
			ilike(rentalItems.shortDescription, pattern),
			ilike(rentalItems.slug, pattern)
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
			.from(rentalItems)
			.where(whereClause)
			.orderBy(asc(rentalItems.sortOrder), desc(rentalItems.createdAt))
			.limit(limit)
			.offset(offset),
		locals.db.select({ total: count() }).from(rentalItems).where(whereClause)
	]);

	const total = Number(totalResult[0]?.total ?? 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

	const payload: PaginatedData<RentalItem> = {
		items,
		meta: { page, limit, total, totalPages }
	};

	return apiSuccess(payload, {
		status: 200,
		headers: {
			'Cache-Control':
				isAdmin || includeUnpublished
					? 'private, no-store'
					: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
		}
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menambahkan barang katalog.'
	);
	if (unauthorized) return unauthorized;

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = createRentalItemSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi data barang gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const resolvedSlug = input.slug ? slugify(input.slug, 200) : slugify(input.name, 200);

	if (resolvedSlug.length < 2) {
		return apiError('Slug barang tidak dapat dibuat dari nama yang diberikan.', {
			status: 422,
			errors: { slug: ['Masukkan slug valid minimal 2 karakter.'] }
		});
	}

	const [categoryRow, existingSlug] = await Promise.all([
		locals.db
			.select({ id: rentalCategories.id })
			.from(rentalCategories)
			.where(eq(rentalCategories.id, input.categoryId))
			.limit(1),
		locals.db
			.select({ id: rentalItems.id })
			.from(rentalItems)
			.where(eq(rentalItems.slug, resolvedSlug))
			.limit(1)
	]);

	if (!categoryRow[0]) {
		return apiError('Kategori barang tidak ditemukan.', {
			status: 422,
			errors: { categoryId: ['Pilih kategori yang valid.'] }
		});
	}

	if (existingSlug.length > 0) {
		return apiError('Slug barang sudah digunakan.', {
			status: 409,
			errors: { slug: ['Slug ini sudah terdaftar, silakan gunakan slug lain.'] }
		});
	}

	try {
		const [created] = await locals.db
			.insert(rentalItems)
			.values({
				categoryId: input.categoryId,
				name: input.name,
				slug: resolvedSlug,
				shortDescription: input.shortDescription,
				description: input.description,
				specs: input.specs,
				includes: input.includes,
				variants: input.variants,
				pricePerDay: input.pricePerDay ?? null,
				unitLabel: input.unitLabel,
				minDurationDays: input.minDurationDays,
				stockQty: input.stockQty,
				requiresDeposit: input.requiresDeposit,
				deliveryAvailable: input.deliveryAvailable,
				pickupAvailable: input.pickupAvailable,
				imageKey: input.imageKey ?? null,
				imageUrl: input.imageUrl ?? null,
				isFeatured: input.isFeatured,
				isPublished: input.isPublished,
				sortOrder: input.sortOrder
			})
			.returning();

		if (!created) {
			return apiError('Gagal menyimpan barang katalog.', { status: 500 });
		}

		return apiSuccess(created, {
			status: 201,
			message: 'Barang katalog berhasil ditambahkan.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Slug barang sudah digunakan.', { status: 409 });
		}
		console.error('[POST /api/catalog] Database error:', error);
		return apiError('Terjadi kesalahan internal saat menyimpan barang.', { status: 500 });
	}
};
