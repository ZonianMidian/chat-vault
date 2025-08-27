import type { Emote, EmotePage } from '$lib/types/common.js';

import { fetchEmote } from '$lib/emotes/fetchEmote';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<EmotePage> {
	let { provider, id } = params;

	if (!provider || !id) {
		throw error(400, { message: $format('error.id'), custom: true });
	}

	try {
		const emote: Emote = await fetchEmote(provider, id);

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
			emote,
			id
		};
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw error(Number(errorMessage.match(/\d+/)?.[0]) ?? 404, {
			message: errorMessage,
			custom: true
		});
	}
}
