import { getCompanySettings } from '#lib/server/cms/defaults';
import type { PageServerLoad } from './$types';

function sanitizeRedirectTo(raw: string | null): string | null {
	if (!raw) return null;
	if (!raw.startsWith('/') || raw.startsWith('//')) return null;
	return raw;
}

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' });

	const settings = await getCompanySettings(locals.db);
	const rawMode = url.searchParams.get('mode');

	return {
		companyName: settings.companyName,
		logoUrl: settings.logoUrl || '/logo-adasewa.jpg',
		initialMode: rawMode === 'daftar' ? ('signup' as const) : ('signin' as const),
		redirectTo: sanitizeRedirectTo(url.searchParams.get('redirectTo'))
	};
};
