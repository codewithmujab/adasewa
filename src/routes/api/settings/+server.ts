import { eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { DEFAULT_COMPANY_SETTINGS_ID, getCompanySettings } from '#lib/server/cms/defaults';
import { companySettings } from '#lib/server/db/schema';
import { deleteR2ObjectsSafely } from '#lib/server/storage/r2';
import { updateSettingsSchema } from '#lib/schemas/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const isAdmin = Boolean(locals.user && locals.session);
	const settings = await getCompanySettings(locals.db);

	return apiSuccess(settings, {
		status: 200,
		headers: {
			'Cache-Control': isAdmin
				? 'private, no-store'
				: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
		}
	});
};

const handleUpsert: RequestHandler = async ({ request, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk memperbarui pengaturan perusahaan.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) {
		return parsedBody.response;
	}

	const validation = updateSettingsSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Validasi pengaturan perusahaan gagal.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const input = validation.data;

	const [existing] = await locals.db
		.select()
		.from(companySettings)
		.where(eq(companySettings.id, DEFAULT_COMPANY_SETTINGS_ID))
		.limit(1);

	const nextLogoKey = input.logoKey !== undefined ? input.logoKey : (existing?.logoKey ?? null);
	const nextLogoUrl = input.logoUrl !== undefined ? input.logoUrl : (existing?.logoUrl ?? null);
	const nextImageKey = input.imageKey !== undefined ? input.imageKey : (existing?.imageKey ?? null);
	const nextImageUrl = input.imageUrl !== undefined ? input.imageUrl : (existing?.imageUrl ?? null);

	const values = {
		id: DEFAULT_COMPANY_SETTINGS_ID,
		companyName: input.companyName,
		tagline: input.tagline,
		aboutShort: input.aboutShort,
		aboutFull: input.aboutFull,
		vision: input.vision ?? null,
		mission: input.mission ?? null,
		email: input.email,
		phone: input.phone ?? null,
		address: input.address ?? null,
		logoKey: nextLogoKey,
		logoUrl: nextLogoUrl,
		imageKey: nextImageKey,
		imageUrl: nextImageUrl,
		socialLinks: input.socialLinks,
		metaTitle: input.metaTitle ?? null,
		metaDescription: input.metaDescription ?? null,
		updatedAt: new Date()
	};

	try {
		const [saved] = await locals.db
			.insert(companySettings)
			.values(values)
			.onConflictDoUpdate({
				target: companySettings.id,
				set: {
					companyName: values.companyName,
					tagline: values.tagline,
					aboutShort: values.aboutShort,
					aboutFull: values.aboutFull,
					vision: values.vision,
					mission: values.mission,
					email: values.email,
					phone: values.phone,
					address: values.address,
					logoKey: values.logoKey,
					logoUrl: values.logoUrl,
					imageKey: values.imageKey,
					imageUrl: values.imageUrl,
					socialLinks: values.socialLinks,
					metaTitle: values.metaTitle,
					metaDescription: values.metaDescription,
					updatedAt: values.updatedAt
				}
			})
			.returning();

		if (!saved) {
			return apiError('Gagal menyimpan pengaturan perusahaan.', { status: 500 });
		}

		const obsoleteKeys: string[] = [];
		if (existing?.logoKey && input.logoKey !== undefined && existing.logoKey !== input.logoKey) {
			obsoleteKeys.push(existing.logoKey);
		}
		if (
			existing?.imageKey &&
			input.imageKey !== undefined &&
			existing.imageKey !== input.imageKey
		) {
			obsoleteKeys.push(existing.imageKey);
		}

		if (obsoleteKeys.length > 0) {
			await deleteR2ObjectsSafely(platform, obsoleteKeys);
		}

		return apiSuccess(saved, {
			status: 200,
			message: 'Pengaturan perusahaan berhasil disimpan.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		console.error('[PATCH /api/settings] Database error:', error);
		return apiError('Terjadi kesalahan internal saat menyimpan pengaturan perusahaan.', {
			status: 500
		});
	}
};

export const PATCH = handleUpsert;
export const PUT = handleUpsert;
