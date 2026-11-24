import { asc, eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	getPgErrorCode,
	parseJsonBody,
	requireSuperAdmin
} from '#lib/server/api/response';
import { branchItemStocks, branches, rentalItems } from '#lib/server/db/schema';
import { createBranchSchema, slugify } from '#lib/schemas/branch';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const includeInactive = url.searchParams.get('includeInactive') === 'true';
	const isStaff =
		Boolean(locals.user && locals.session) &&
		(locals.user?.role === 'admin' || locals.user?.role === 'branch_admin');

	const rows =
		includeInactive && isStaff
			? await locals.db
					.select()
					.from(branches)
					.orderBy(asc(branches.sortOrder), asc(branches.name))
			: await locals.db
					.select()
					.from(branches)
					.where(eq(branches.isActive, true))
					.orderBy(asc(branches.sortOrder), asc(branches.name));

	return apiSuccess(rows, {
		status: 200,
		headers: {
			'Cache-Control':
				includeInactive && isStaff ? 'private, no-store' : 'public, max-age=60, s-maxage=300'
		}
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireSuperAdmin(
		locals,
		'Hanya Owner / Super Admin yang dapat menambahkan cabang baru.'
	);
	if (unauthorized) return unauthorized;

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = createBranchSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data cabang tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;
	const resolvedSlug = input.slug ? slugify(input.slug, 140) : slugify(input.city || input.name, 140);

	try {
		const [created] = await locals.db
			.insert(branches)
			.values({
				code: input.code,
				name: input.name,
				slug: resolvedSlug,
				city: input.city,
				address: input.address,
				phone: input.phone,
				whatsapp: input.whatsapp,
				deliveryFeeDefault: input.deliveryFeeDefault,
				operatingHours: input.operatingHours,
				isActive: input.isActive,
				sortOrder: input.sortOrder
			})
			.returning();

		if (!created) {
			return apiError('Gagal menyimpan cabang baru.', { status: 500 });
		}

		// Otomatis isi stok & harga awal untuk semua barang master ke cabang baru
		const allItems = await locals.db
			.select({
				id: rentalItems.id,
				pricePerDay: rentalItems.pricePerDay,
				stockQty: rentalItems.stockQty
			})
			.from(rentalItems);

		if (allItems.length > 0) {
			const stockSeed = allItems.map((item) => ({
				branchId: created.id,
				rentalItemId: item.id,
				pricePerDay: item.pricePerDay ?? 100000,
				stockQty: Math.max(1, item.stockQty),
				isAvailable: true
			}));
			for (let i = 0; i < stockSeed.length; i += 50) {
				await locals.db
					.insert(branchItemStocks)
					.values(stockSeed.slice(i, i + 50))
					.onConflictDoNothing({
						target: [branchItemStocks.branchId, branchItemStocks.rentalItemId]
					});
			}
		}

		return apiSuccess(created, {
			status: 201,
			message: `${created.name} berhasil ditambahkan bersama ${allItems.length} entri stok/harga awal.`,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		if (getPgErrorCode(error) === '23505') {
			return apiError('Kode atau slug cabang sudah digunakan.', { status: 409 });
		}
		console.error('[POST /api/branches] Database error:', error);
		return apiError('Terjadi kesalahan saat menyimpan cabang.', { status: 500 });
	}
};
