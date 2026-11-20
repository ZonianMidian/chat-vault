import type { RequestHandler } from './$types';

import { searchChannels } from '#lib/server/channels/searchChannel.ts';
import { parseChannelSearch } from '#lib/channels/search.ts';
import { RequestError } from '#lib/server/http.ts';
import { toHttpError } from '#lib/server/load.ts';

const MAX_CURSOR = 2000;

export const GET: RequestHandler = async ({ url }) => {
	try {
		const cursor = url.searchParams.get('cursor');
		if (!cursor || cursor.length > MAX_CURSOR || !/^[\w-]+$/.test(cursor)) {
			throw new RequestError(400, 'status.400');
		}

		return Response.json(await searchChannels(parseChannelSearch(url.searchParams), cursor), {
			headers: { 'Cache-Control': 'private, max-age=30' }
		});
	} catch (err) {
		toHttpError(err);
	}
};
