import type { PageServerLoad } from './$types';
import type { User } from '#lib/types/common.ts';

import { getChannelByLink, isLink } from '#lib/channels/getChannelByLink.ts';
import { searchChannels } from '#lib/server/channels/searchChannel.ts';
import { critical } from '#lib/server/load.ts';
import { redirect } from '@sveltejs/kit';

const MAX_QUERY_LENGTH = 200;

export const load: PageServerLoad = async (event) => {
	const query = (event.url.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);

	if (!query) {
		return { query, channels: [] as User[] };
	}

	if (isLink(query)) {
		const channel = getChannelByLink(query);
		if (channel) redirect(307, channel);

		return { query, channels: [] as User[] };
	}

	return {
		query,
		...(await critical(event, { channels: searchChannels(query) }))
	};
};
