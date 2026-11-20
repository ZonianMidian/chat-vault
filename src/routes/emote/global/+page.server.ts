import type { PageServerLoad } from './$types';

import { fetchAllGlobalEmotes } from '#lib/server/emotes/fetchGlobals.ts';
import { critical, nonEmpty } from '#lib/server/load.ts';

export const load: PageServerLoad = (event) =>
	critical(event, { emotes: nonEmpty(fetchAllGlobalEmotes()) });
