import type { Channels } from '#lib/types/common.ts';
import type { Provider } from '#lib/providers.ts';

import { getBTTVChannels } from '#lib/server/providers/bttv.ts';
import { getFFZChannels } from '#lib/server/providers/ffz.ts';
import { get7TVChannels } from '#lib/server/providers/7tv.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';

export function fetchChannels(
	provider: Provider,
	emoteId: string,
	page: number,
	before: string | null
): Promise<Channels> {
	switch (provider) {
		case 'bttv':
			return cached(`emote-channels:bttv:${emoteId}:${before ?? ''}`, profiles.list, () =>
				getBTTVChannels(emoteId, before)
			);
		case 'ffz':
			return cached(`emote-channels:ffz:${emoteId}:${page}`, profiles.list, () =>
				getFFZChannels(emoteId, page)
			);
		case '7tv':
			return cached(`emote-channels:7tv:${emoteId}:${page}`, profiles.list, () =>
				get7TVChannels(emoteId, page)
			);
		default:
			return Promise.reject(new RequestError(400, 'error.provider'));
	}
}
