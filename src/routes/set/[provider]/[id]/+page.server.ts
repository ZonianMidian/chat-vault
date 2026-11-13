import type { PageServerLoad } from './$types';

import { redirectToCanonical, requireParam, resolveOrFail } from '#lib/server/params.ts';
import { fetchSet, resolveSet } from '#lib/server/sets/fetchSet.ts';
import { critical } from '#lib/server/load.ts';

export const load: PageServerLoad = async (event) => {
	const { params, url } = event;

	const ref = resolveOrFail(() => resolveSet(params.provider, requireParam(params.id)));
	redirectToCanonical(url, [params.provider, params.id], [ref.provider, ref.id]);

	return {
		...ref,
		...(await critical(event, { set: fetchSet(ref) }))
	};
};
