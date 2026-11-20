import type { ChannelSearchResult } from '#lib/channels/search.ts';
import type { PageServerLoad } from './$types';

import { getChannelByLink, isLink } from '#lib/channels/getChannelByLink.ts';
import { searchChannels } from '#lib/server/channels/searchChannel.ts';
import { parseChannelSearch } from '#lib/channels/search.ts';
import { critical } from '#lib/server/load.ts';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const options = parseChannelSearch(event.url.searchParams);

	if (isLink(options.query)) {
		const channel = getChannelByLink(options.query);
		if (channel) redirect(307, channel);

		const result: ChannelSearchResult = { channels: [], failed: [], next: null };
		return { options, result };
	}

	return {
		options,
		...(await critical(event, { result: searchChannels(options) }))
	};
};
