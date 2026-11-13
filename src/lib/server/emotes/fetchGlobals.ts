import type { Emotes } from '#lib/types/common.ts';
import type { Provider } from '#lib/providers.ts';

import { getYouTubeGlobalEmotes } from '#lib/server/providers/youtube.ts';
import { getTwitchGlobalEmotes } from '#lib/server/providers/twitch.ts';
import { getKickGlobalEmotes } from '#lib/server/providers/kick.ts';
import { getBTTVGlobalEmotes } from '#lib/server/providers/bttv.ts';
import { getFFZGlobalEmotes } from '#lib/server/providers/ffz.ts';
import { get7TVGlobalEmotes } from '#lib/server/providers/7tv.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { log } from '#lib/server/logger.ts';

const fetchers: Record<Provider, () => Promise<Emotes[]>> = {
	twitch: getTwitchGlobalEmotes,
	youtube: getYouTubeGlobalEmotes,
	kick: getKickGlobalEmotes,
	bttv: getBTTVGlobalEmotes,
	ffz: getFFZGlobalEmotes,
	'7tv': get7TVGlobalEmotes
};

export function fetchGlobalEmotes(provider: Provider): Promise<Emotes[]> {
	return cached(`globals:emotes:${provider}`, profiles.globals, fetchers[provider]);
}

export async function fetchAllGlobalEmotes(): Promise<Emotes[]> {
	const providers = Object.keys(fetchers) as Provider[];
	const results = await Promise.allSettled(providers.map(fetchGlobalEmotes));

	return results.flatMap((result, i) => {
		if (result.status === 'fulfilled') return result.value;

		log.error('Global Emotes', `${providers[i]} is unavailable`, result.reason);
		return [];
	});
}

export async function findGlobalEmote(emoteId: string, provider: Provider): Promise<Emotes | null> {
	try {
		const emotes = await fetchGlobalEmotes(provider);
		return emotes.find((item) => item.id === emoteId) ?? null;
	} catch {
		return null;
	}
}
