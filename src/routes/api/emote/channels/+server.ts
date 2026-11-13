import type { RequestHandler } from './$types';

import { fetchChannels } from '#lib/server/emotes/fetchChannels.ts';
import { resolveEmote } from '#lib/server/emotes/fetchEmote.ts';
import { requireParam } from '#lib/server/params.ts';
import { toHttpError } from '#lib/server/load.ts';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams;

	try {
		const { provider, id } = resolveEmote(
			requireParam(query.get('provider')),
			requireParam(query.get('id'))
		);

		const page = Math.max(1, Math.trunc(Number(query.get('page'))) || 1);
		const before = query.get('before');

		return Response.json(
			await fetchChannels(provider, id, page, before && requireParam(before))
		);
	} catch (err) {
		toHttpError(err);
	}
};
