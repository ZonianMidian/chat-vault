import type { Badge, BadgePage } from '$lib/types/common.js';

import { $format, rezizeImageUrl } from '$lib/utils.js';
import { fetchBadge } from '$lib/badges/fetchBadge.js';
import { waitLocale } from 'svelte-i18n';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<BadgePage> {
	let { provider, id } = params;

	await waitLocale();

	if (!provider || !id) {
		throw error(400, { message: $format('error.id'), custom: true });
	}

	try {
		const badge: Badge = await fetchBadge(provider, id);

		let pageImage =
			badge?.images?.[2] ??
			badge?.images?.[1] ??
			badge?.images?.[0] ??
			`${url.origin}/favicon.png`;

		if (pageImage.startsWith('/')) {
			pageImage = `${url.origin}${pageImage}`;
		}

		return {
			id,
			provider: badge.provider,
			badge: badge,
			pageImage: rezizeImageUrl(pageImage, 72)
		};
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw error(Number(errorMessage.match(/\d+/)?.[0]) ?? 404, {
			message: errorMessage,
			custom: true
		});
	}
}
