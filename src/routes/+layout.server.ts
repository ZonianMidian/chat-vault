import type { LayoutServerLoad } from './$types';

import { getLocaleNames } from '#lib/server/i18n.ts';

export const load: LayoutServerLoad = ({ locals }) => ({
	locale: locals.locale,
	theme: locals.theme,
	locales: getLocaleNames()
});
