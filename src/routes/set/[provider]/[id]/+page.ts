import type { Set, SetPage } from '$lib/types/common.js';

import { fetchSet } from '$lib/sets/fetchSet';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<SetPage> {
	let { provider, id } = params;

	if (!provider || !id) {
		throw error(400, { message: $format('error.id'), custom: true });
	}

	try {
		const set: Set = await fetchSet(provider, id);

		const pageImage = set.owner?.avatar ?? `${url.origin}/favicon.png`;

		return {
			provider: set.provider,
			pageImage,
			set,
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
