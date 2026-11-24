import { getActiveBranches } from '#lib/server/branches';
import { getCompanySettings } from '#lib/server/cms/defaults';
import { getUserPointBalance } from '#lib/server/points';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, setHeaders, url }) => {
	const isAuthenticated = Boolean(locals.user && locals.session);
	const isPrivateRoute =
		url.pathname === '/checkout' ||
		url.pathname === '/keranjang' ||
		url.pathname === '/akun' ||
		url.pathname.startsWith('/akun/');

	setHeaders({
		'Cache-Control':
			isAuthenticated || isPrivateRoute
				? 'private, no-store'
				: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	const [settings, activeBranches, pointBalance] = await Promise.all([
		getCompanySettings(locals.db),
		getActiveBranches(locals.db),
		locals.user ? getUserPointBalance(locals.db, locals.user.id) : Promise.resolve(0)
	]);

	return {
		settings,
		branches: activeBranches,
		isAuthenticated,
		currentUser: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					email: locals.user.email,
					role: locals.user.role ?? 'customer',
					branchId: locals.user.branchId ?? null,
					pointBalance
				}
			: null
	};
};
