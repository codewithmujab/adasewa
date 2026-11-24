import { redirect } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { getCompanySettings } from '#lib/server/cms/defaults';
import { branches } from '#lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, setHeaders, url }) => {
	setHeaders({ 'Cache-Control': 'private, no-store' });

	if (!locals.user || !locals.session) {
		const redirectTo = encodeURIComponent(`${url.pathname}${url.search}`);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	const role = locals.user.role ?? 'customer';
	if (role !== 'admin' && role !== 'branch_admin') {
		redirect(303, '/akun');
	}

	const ownerOnlyPaths = ['/admin/settings', '/admin/services', '/admin/portfolios', '/admin/points'];
	if (
		role === 'branch_admin' &&
		ownerOnlyPaths.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))
	) {
		redirect(303, '/admin');
	}

	const [settings, allBranches] = await Promise.all([
		getCompanySettings(locals.db),
		locals.db
			.select()
			.from(branches)
			.orderBy(asc(branches.sortOrder), asc(branches.name))
	]);

	const userBranchId = locals.user.branchId ?? null;
	const assignedBranch = userBranchId
		? (allBranches.find((b) => b.id === userBranchId) ?? null)
		: null;

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role,
			branchId: userBranchId
		},
		isSuperAdmin: role === 'admin',
		assignedBranch,
		branches: allBranches,
		companyName: settings.companyName,
		logoUrl: settings.logoUrl || '/logo-adasewa.jpg'
	};
};
