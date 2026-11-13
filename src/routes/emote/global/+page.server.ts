import type { PageServerLoad } from './$types';

import { fetchAllGlobalEmotes } from '#lib/server/emotes/fetchGlobals.ts';
import { critical } from '#lib/server/load.ts';

export const load: PageServerLoad = (event) => critical(event, { emotes: fetchAllGlobalEmotes() });
