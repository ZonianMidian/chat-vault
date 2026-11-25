import type { PageServerLoad } from './$types';

import { canonicalBadge, fetchBadge, resolveBadge } from '#lib/server/badges/fetchBadge.ts';
import { redirectToCanonical, requireParam, resolveOrFail } from '#lib/server/params.ts';
import { fetchExtras } from '#lib/server/badges/fetchExtras.ts';
import { createTranslator } from '#lib/server/i18n.ts';
import { critical } from '#lib/server/load.ts';

export const load: PageServerLoad = async (event) => {
	const { params, url, locals } = event;

	const i18n = createTranslator(locals.locale);
	const ref = await canonicalBadge(
		resolveOrFail(() => resolveBadge(params.provider, requireParam(params.id))),
		i18n
	);
	redirectToCanonical(url, [params.provider, params.id], [ref.provider, ref.id]);

	const badge = fetchBadge(ref, i18n);

	return {
		...ref,
		...(await critical(event, { badge })),
		extras: badge.then(fetchExtras).catch(() => null)
	};
};
