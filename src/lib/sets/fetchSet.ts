import type { Set } from '$lib/types/common';

import { $format, objectIdToUlid, updateURLPath } from '$lib/utils';
import { getTwitchSet } from '$lib/providers/twitch';
import { getBTTVSet } from '$lib/providers/bttv';
import { getFFZSet } from '$lib/providers/ffz';
import { get7TVSet } from '$lib/providers/7tv';
import { browser } from '$app/environment';

type SetFetcher = (emoteId: string) => Promise<Set>;

const providerMap: Record<string, { canonical: string; fetcher: SetFetcher }> = {
	twitch: { canonical: 'twitch', fetcher: getTwitchSet },
	ttv: { canonical: 'twitch', fetcher: getTwitchSet },
	tw: { canonical: 'twitch', fetcher: getTwitchSet },

	bettertwitchtv: { canonical: 'bttv', fetcher: getBTTVSet },
	betterttv: { canonical: 'bttv', fetcher: getBTTVSet },
	bttv: { canonical: 'bttv', fetcher: getBTTVSet },

	frankerfacez: { canonical: 'ffz', fetcher: getFFZSet },
	ffz: { canonical: 'ffz', fetcher: getFFZSet },

	seventv: { canonical: '7tv', fetcher: get7TVSet },
	stv: { canonical: '7tv', fetcher: get7TVSet },
	'7tv': { canonical: '7tv', fetcher: get7TVSet }
};

export async function fetchSet(provider: string, setId: string): Promise<Set> {
	try {
		const key = provider.toLowerCase();
		const entry = providerMap[key];

		if (!entry) throw new Error($format('error.provider'));

		const { canonical, fetcher } = entry;

		if (key !== canonical && browser) {
			updateURLPath(provider, canonical);
		}

		if (canonical === '7tv' && setId.length === 24) {
			const newId = objectIdToUlid(setId);

			if (browser) {
				updateURLPath(setId, newId);
			}

			setId = newId;
		}

		return await fetcher(setId);
	} catch (err) {
		console.error(`[${$format('set.label')}]:`, err);
		throw new Error(err instanceof Error ? err.message : $format('error.unknown'));
	}
}
