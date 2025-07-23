import type { Emotes } from '$lib/types/common';

import { getYouTubeGlobalEmotes } from '../providers/youtube';
import { getTwitchGlobalEmotes } from '../providers/twitch';
import { getKickGlobalEmotes } from '../providers/kick';
import { getBTTVGlobalEmotes } from '../providers/bttv';
import { getFFZGlobalEmotes } from '../providers/ffz';
import { get7TVGlobalEmotes } from '../providers/7tv';
import { $format, getOrCacheData } from '$lib/utils';

const cacheKey = 'globalEmotes';
const cacheExpirationKey = 'globalEmotesExp';

const cacheDuration = 60 * 60 * 1000; // 1h

export async function fetchGlobalEmotes(provider: string): Promise<Emotes[]> {
	try {
		switch (provider.toLowerCase()) {
			case 'twitch':
			case 'ttv':
			case 'tw': {
				return await getTwitchGlobalEmotes();
			}
			case 'youtube':
			case 'yt': {
				return await getYouTubeGlobalEmotes();
			}
			case 'kick': {
				return await getKickGlobalEmotes();
			}
			case 'betterttv':
			case 'bttv': {
				return await getBTTVGlobalEmotes();
			}
			case 'frankerfacez':
			case 'ffz': {
				return await getFFZGlobalEmotes();
			}
			case 'seventv':
			case '7tv': {
				return await get7TVGlobalEmotes();
			}
			case 'all': {
				return await getOrCacheData<Emotes[]>(
					async () => {
						const results = await Promise.allSettled([
							getTwitchGlobalEmotes(),
							getYouTubeGlobalEmotes(),
							getKickGlobalEmotes(),
							getBTTVGlobalEmotes(),
							getFFZGlobalEmotes(),
							get7TVGlobalEmotes()
						]);

						const emotesArrays = results
							.filter((r) => r.status === 'fulfilled')
							.map((r) => (r as PromiseFulfilledResult<Emotes[]>).value);
						return emotesArrays.flat();
					},
					cacheKey,
					cacheExpirationKey,
					cacheDuration,
					[]
				);
			}
			default:
				throw new Error($format('error.provider'));
		}
	} catch (err) {
		console.error(`[${$format('global.label')}] ${$format('navbar.emotes')}:`, err);
		throw new Error(
			`[${$format('global.label')}] ${$format('navbar.emotes')}: ${err instanceof Error ? err.message : $format('error.unknown')}`
		);
	}
}
