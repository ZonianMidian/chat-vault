import type { ChannelData, ChannelPage } from '$lib/types/common.js';

import { fetchChannel } from '$lib/channels/fetchChannel';
import { waitLocale } from 'svelte-i18n';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

export const ssr = false;

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<ChannelPage> {
	let { provider, login } = params;

	await waitLocale();

	if (!provider || !login) {
		throw error(400, { message: $format('error.id'), custom: true });
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
		throw error(Number(errorMessage.match(/\d+/)?.[0]) ?? 404, {
			message: errorMessage,
			custom: true
		});
	}
}
