import type { PageServerLoad } from './$types';

import { fetchAllGlobalBadges } from '#lib/server/badges/fetchGlobals.ts';
import { createTranslator } from '#lib/server/i18n.ts';
import { critical } from '#lib/server/load.ts';

export const load: PageServerLoad = (event) =>
	critical(event, { badges: fetchAllGlobalBadges(createTranslator(event.locals.locale)) });
