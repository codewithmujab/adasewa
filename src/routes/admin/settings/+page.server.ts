import { getCompanySettings } from '#lib/server/cms/defaults';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const settings = await getCompanySettings(locals.db);

	return {
		settings
	};
};
