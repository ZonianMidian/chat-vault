import type { PageServerLoad } from './$types';

import { getEmoteByLink } from '#lib/emotes/getEmoteByLink.ts';
import { searchEmotes } from '#lib/server/emotes/searchEmotes.ts';
import { isLink } from '#lib/channels/getChannelByLink.ts';
import { parseEmoteSearch } from '#lib/emotes/search.ts';
import { critical } from '#lib/server/load.ts';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const options = parseEmoteSearch(event.url.searchParams);

	if (isLink(options.query)) {
		const emote = getEmoteByLink(options.query);
		if (emote) redirect(307, `/emote/${emote.provider}/${encodeURIComponent(emote.id)}`);
	}

	return {
		options,
		...(await critical(event, { result: searchEmotes(options) }))
	};
};
