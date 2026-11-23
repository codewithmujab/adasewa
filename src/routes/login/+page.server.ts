import { ALLOW_ADMIN_SIGNUP } from '$app/env/private';
import { count } from 'drizzle-orm';
import { getCompanySettings } from '#lib/server/cms/defaults';
import { user } from '#lib/server/db/schema';
import type { PageServerLoad } from './$types';

function sanitizeRedirectTo(raw: string | null): string {
	if (!raw) return '/admin';
	if (!raw.startsWith('/') || raw.startsWith('//')) return '/admin';
	return raw;
}

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' });

	const [settings, userCountRes] = await Promise.all([
		getCompanySettings(locals.db),
		locals.db.select({ total: count() }).from(user)
	]);

	const hasAnyAdmin = Number(userCountRes[0]?.total ?? 0) > 0;
	const allowSignup = ALLOW_ADMIN_SIGNUP;

	return {
		companyName: settings.companyName,
		allowSignup,
		hasAnyAdmin,
		redirectTo: sanitizeRedirectTo(url.searchParams.get('redirectTo'))
	};
};
