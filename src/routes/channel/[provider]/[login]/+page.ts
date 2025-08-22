import type { ChannelData, ChannelPage } from '$lib/types/common.js';

import { fetchChannel } from '$lib/channels/fetchChannel';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<ChannelPage> {
	let { provider, login } = params;

	if (!provider || !login) {
		throw error(400, $format('error.id'));
	}

	try {
		const channel: ChannelData = await fetchChannel(provider, login);
		const pageImage = channel.user.images.avatar ?? `${url.origin}/favicon.png`;

		return {
			id: channel.user.id,
			channel,
			provider: channel.provider,
			pageImage
		};
	} catch (err) {
		const errorMessage = (err as Error).message;

		return {
			id: '',
			channel: null,
			provider,
			error: errorMessage,
			pageImage: `${url.origin}/favicon.png`
		};
	}
}
