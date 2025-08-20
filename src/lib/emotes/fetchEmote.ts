import type { Emote } from '$lib/types/common';

import { $format, objectIdToUlid, updateURLPath } from '$lib/utils';
import { getYouTubeEmote } from '$lib/providers/youtube';
import { getTwitchEmote } from '$lib/providers/twitch';
import { getBTTVEmote } from '$lib/providers/bttv';
import { getKickEmote } from '$lib/providers/kick';
import { getFFZEmote } from '$lib/providers/ffz';
import { get7TVEmote } from '$lib/providers/7tv';
import { browser } from '$app/environment';

type EmoteFetcher = (emoteId: string) => Promise<Emote>;

const providerMap: Record<string, { canonical: string; fetcher: EmoteFetcher }> = {
	twitch: { canonical: 'twitch', fetcher: getTwitchEmote },
	ttv: { canonical: 'twitch', fetcher: getTwitchEmote },
	tw: { canonical: 'twitch', fetcher: getTwitchEmote },

	kick: { canonical: 'kick', fetcher: getKickEmote },

	youtube: { canonical: 'youtube', fetcher: getYouTubeEmote },

	bettertwitchtv: { canonical: 'bttv', fetcher: getBTTVEmote },
	betterttv: { canonical: 'bttv', fetcher: getBTTVEmote },
	bttv: { canonical: 'bttv', fetcher: getBTTVEmote },

	frankerfacez: { canonical: 'ffz', fetcher: getFFZEmote },
	ffz: { canonical: 'ffz', fetcher: getFFZEmote },

	seventv: { canonical: '7tv', fetcher: get7TVEmote },
	stv: { canonical: '7tv', fetcher: get7TVEmote },
	'7tv': { canonical: '7tv', fetcher: get7TVEmote }
};

export async function fetchEmote(provider: string, emoteId: string): Promise<Emote> {
	try {
		const key = provider.toLowerCase();
		const entry = providerMap[key];

		if (!entry) throw new Error($format('error.provider'));

		const { canonical, fetcher } = entry;

		if (key !== canonical && browser) {
			updateURLPath(provider, canonical);
		}

		if (canonical === '7tv' && emoteId.length === 24) {
			const newId = objectIdToUlid(emoteId);

			if (browser) {
				updateURLPath(emoteId, newId);
			}

			emoteId = newId;
		}

		return await fetcher(emoteId);
	} catch (err) {
		console.error(`[${$format('emote.label')}]`, err);
		throw new Error(
			`[${$format('emote.label')}]: ${err instanceof Error ? err.message : $format('error.unknown')}`
		);
	}
}
