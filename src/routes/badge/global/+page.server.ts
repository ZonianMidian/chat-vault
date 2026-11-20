import type { PageServerLoad } from './$types';

import { fetchAllGlobalBadges } from '#lib/server/badges/fetchGlobals.ts';
import { critical, nonEmpty } from '#lib/server/load.ts';
import { createTranslator } from '#lib/server/i18n.ts';

export const load: PageServerLoad = (event) =>
	critical(event, {
		badges: nonEmpty(fetchAllGlobalBadges(createTranslator(event.locals.locale)))
	});
