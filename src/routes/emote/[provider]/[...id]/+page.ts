import type { Emote, EmotePage } from '$lib/types/common.js';

import { fetchEmote } from '$lib/emotes/fetchEmote';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<EmotePage> {
	let { provider, id } = params;

	if (!provider || !id) {
		throw error(400, $format('error.id'));
	}

	try {
		const emote: Emote = await fetchEmote(provider, id);

		const pageTitle = `Chat Vault | ${$format('emote.label')}: ${emote?.name ?? ''}`;
		let pageImage =
			emote?.images?.[2] ??
			emote?.images?.[1] ??
			emote?.images?.[0] ??
			`${url.origin}/favicon.png`;

		if (pageImage.startsWith('/')) {
			pageImage = `${url.origin}${pageImage}`;
		}

		return {
			pageImage: pageImage.replace(/\.avif$/, '.webp'),
			provider: emote.provider,
			pageTitle,
			emote,
			id
		};
	} catch (err) {
		const errorMessage = (err as Error).message;
		const pageTitle = `Chat Vault | Error`;

		return {
			pageImage: `${url.origin}/favicon.png`,
			error: errorMessage,
			emote: null,
			pageTitle,
			provider,
			id
		};
	}
}
