import { redirect } from '@sveltejs/kit';
import { getCompanySettings } from '#lib/server/cms/defaults';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, setHeaders, url }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' });

	if (!locals.user || !locals.session) {
		const redirectTo = encodeURIComponent(`${url.pathname}${url.search}`);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	if (locals.user.role !== 'admin') {
		redirect(303, '/akun');
	}

	const settings = await getCompanySettings(locals.db);

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role
		},
		companyName: settings.companyName
	};
};
