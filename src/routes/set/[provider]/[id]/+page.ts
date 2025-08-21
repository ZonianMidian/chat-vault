import type { Set, SetPage } from '$lib/types/common.js';

import { fetchSet } from '$lib/sets/fetchSet';
import { $format } from '$lib/utils.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }): Promise<SetPage> {
	let { provider, id } = params;

	if (!provider || !id) {
		throw error(400, $format('error.id'));
	}

	try {
		const set: Set = await fetchSet(provider, id);

		const pageTitle = `${$format('set.label')}: ${set.name}`;
		const pageImage = set.owner?.avatar ?? `${url.origin}/favicon.png`;

		return {
			provider: set.provider,
			pageTitle,
			pageImage,
			set,
			id
		};
	} catch (err) {
		const errorMessage = (err as Error).message;
		const pageTitle = 'Error';

		return {
			pageImage: `${url.origin}/favicon.png`,
			error: errorMessage,
			set: null,
			pageTitle,
			provider,
			id
		};
	}
}
