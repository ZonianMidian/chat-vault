import type { PageServerLoad } from './$types';

import { redirectToCanonical, requireParam } from '#lib/server/params.ts';
import { fetchChannel, resolveChannel } from '#lib/server/channels/fetchChannel.ts';
import { fetchChannelEmotes } from '#lib/server/channels/fetchEmotes.ts';
import { createTranslator } from '#lib/server/i18n.ts';
import { critical, optional, toHttpError } from '#lib/server/load.ts';

export const load: PageServerLoad = async (event) => {
	const { params, url, locals } = event;

	const ref = await Promise.resolve()
		.then(() => resolveChannel(params.provider, requireParam(params.login)))
		.catch(toHttpError);
	redirectToCanonical(url, [params.provider, params.login], [ref.provider, ref.login]);

	const channel = fetchChannel(ref, createTranslator(locals.locale));

	return {
		...ref,
		...(await critical(event, { channel })),
		providers: optional(
			channel.then(({ user, provider }) => fetchChannelEmotes(user.id, provider)),
			[]
		)
	};
};
