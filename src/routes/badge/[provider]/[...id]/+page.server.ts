import type { PageServerLoad } from './$types';

import { redirectToCanonical, requireParam, resolveOrFail } from '#lib/server/params.ts';
import { fetchBadge, resolveBadge } from '#lib/server/badges/fetchBadge.ts';
import { fetchExtras } from '#lib/server/badges/fetchExtras.ts';
import { createTranslator } from '#lib/server/i18n.ts';
import { critical } from '#lib/server/load.ts';

export const load: PageServerLoad = async (event) => {
	const { params, url, locals } = event;

	const ref = resolveOrFail(() => resolveBadge(params.provider, requireParam(params.id)));
	redirectToCanonical(url, [params.provider, params.id], [ref.provider, ref.id]);

	const badge = fetchBadge(ref, createTranslator(locals.locale));

	return {
		...ref,
		...(await critical(event, { badge })),
		extras: badge.then(fetchExtras).catch(() => null)
	};
};
