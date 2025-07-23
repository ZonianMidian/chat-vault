import type { Badge } from '$lib/types/common';

import { $format, objectIdToUlid, updateURLPath } from '$lib/utils';
import { getTwitchBadge } from '$lib/providers/twitch';
import { getKickBadge } from '$lib/providers/kick';
import { browser } from '$app/environment';

type BadgeFetcher = (emoteId: string) => Promise<Badge>;

const providerMap: Record<string, { canonical: string; fetcher: BadgeFetcher }> = {
	twitch: { canonical: 'twitch', fetcher: getTwitchBadge },
	ttv: { canonical: 'twitch', fetcher: getTwitchBadge },
	tw: { canonical: 'twitch', fetcher: getTwitchBadge },

	kick: { canonical: 'kick', fetcher: getKickBadge }
};

export async function fetchBadge(provider: string, emoteId: string): Promise<Badge> {
	try {
		const key = provider.toLowerCase();
		const entry = providerMap[key];

		if (!entry) throw new Error($format('error.provider'));

		const { canonical, fetcher } = entry;

		if (key !== canonical && browser) {
			updateURLPath(provider, canonical);
		}

		if (canonical === '7tv' && emoteId.length === 24 && browser) {
			const newId = objectIdToUlid(emoteId);
			updateURLPath(emoteId, newId);
			emoteId = newId;
		}

		return await fetcher(emoteId);
	} catch (err) {
		console.error(`[${$format('badge.label')}]:`, err);
		throw new Error(err instanceof Error ? err.message : $format('error.unknown'));
	}
}
