import type { PageServerLoad } from './$types';

import { redirectToCanonical, requireParam, resolveOrFail } from '#lib/server/params.ts';
import { emptyExtras, fetchExtras } from '#lib/server/emotes/fetchExtras.ts';
import { fetchEmote, resolveEmote } from '#lib/server/emotes/fetchEmote.ts';
import { fetchVariants } from '#lib/server/emotes/fetchVariants.ts';
import { critical, optional } from '#lib/server/load.ts';

export const load: PageServerLoad = async (event) => {
	const { params, url } = event;

	const ref = resolveOrFail(() => resolveEmote(params.provider, requireParam(params.id)));
	redirectToCanonical(url, [params.provider, params.id], [ref.provider, ref.id]);

	const emote = fetchEmote(ref);

	return {
		...ref,
		...(await critical(event, { emote })),
		extras: optional(emote.then(fetchExtras), emptyExtras()),
		variants: optional(emote.then(fetchVariants), [])
	};
};
