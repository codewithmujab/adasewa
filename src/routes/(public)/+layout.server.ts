import { getCompanySettings } from '#lib/server/cms/defaults';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, setHeaders }) => {
	const isAuthenticated = Boolean(locals.user && locals.session);

	setHeaders({
		'Cache-Control': isAuthenticated
			? 'private, no-store'
			: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	const settings = await getCompanySettings(locals.db);

	return {
		settings,
		isAuthenticated
	};
};
