import type { LayoutLoad } from './$types';

import { loadLocale } from '#lib/i18n/index.ts';

export const load: LayoutLoad = async ({ data }) => {
	await loadLocale(data.locale);

	return data;
};
