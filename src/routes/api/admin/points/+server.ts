import { eq } from 'drizzle-orm';
import {
	apiError,
	apiSuccess,
	formatZodErrors,
	parseJsonBody,
	requireAdmin
} from '#lib/server/api/response';
import { user } from '#lib/server/db/schema';
import { adminAdjustPointsSchema } from '#lib/schemas/order';
import { recordPointMovement } from '#lib/server/points';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Hanya admin yang dapat menyesuaikan saldo Rekening Poin.'
	);
	if (unauthorized) return unauthorized;

	const parsedBody = await parseJsonBody(request);
	if (!parsedBody.ok) return parsedBody.response;

	const validation = adminAdjustPointsSchema.safeParse(parsedBody.data);
	if (!validation.success) {
		return apiError('Data penyesuaian poin tidak valid.', {
			status: 422,
			errors: formatZodErrors(validation.error)
		});
	}

	const { userId, delta, description } = validation.data;

	const [targetUser] = await locals.db
		.select({ id: user.id, name: user.name, pointBalance: user.pointBalance })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!targetUser) {
		return apiError('Akun penyewa tidak ditemukan.', { status: 404 });
	}

	const movement = await recordPointMovement(locals.db, {
		userId: targetUser.id,
		delta,
		type: 'admin_adjust',
		description
	});

	if (!movement) {
		return apiError(
			`Saldo Rekening Poin ${targetUser.name} (${targetUser.pointBalance} poin) tidak mencukupi untuk pengurangan ini.`,
			{ status: 409 }
		);
	}

	return apiSuccess(
		{
			userId: targetUser.id,
			newBalance: movement.newBalance,
			transaction: movement.transaction
		},
		{
			status: 201,
			message: `Rekening Poin ${targetUser.name} berhasil disesuaikan (${delta > 0 ? `+${delta}` : delta} poin).`,
			headers: { 'Cache-Control': 'private, no-store' }
		}
	);
};
