import type { Badge, BadgePage } from '$lib/types/common.js';

import { fetchGlobalBadges } from '$lib/badges/fetchGlobals';
import { fetchBadge } from '$lib/badges/fetchBadge.js';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<BadgePage> {
	let { provider, id } = params;

	if (!provider || !id) {
		throw error(400, $format('error.id'));
	}

	await fetchGlobalBadges('all');

	try {
		const badge: Badge = await fetchBadge(provider, id);

		const pageTitle = `Chat Vault | ${$format('badge.label')}: ${badge?.name ?? ''}`;
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
			pageTitle,
			pageImage
		};
	} catch (err) {
		const errorMessage = (err as Error).message;
		const pageTitle = `Chat Vault | Error`;

		return {
			id,
			provider,
			error: errorMessage,
			badge: null,
			pageTitle,
			pageImage: `${url.origin}/favicon.png`
		};
	}
}
