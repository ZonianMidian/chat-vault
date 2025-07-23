import type { ChannelProvider, Platforms } from '$lib/types/common';

import { getBTTVEmotes } from '$lib/providers/bttv';
import { getFFZEmotes } from '$lib/providers/ffz';
import { get7TVEmotes } from '$lib/providers/7tv';
import { $format } from '$lib/utils';

export async function fetchEmotes(
	provider: string,
	channelId: string,
	platform: string
): Promise<ChannelProvider | ChannelProvider[]> {
	try {
		switch (provider.toLowerCase()) {
			case 'betterttv':
			case 'bttv': {
				return await getBTTVEmotes(channelId, platform as Platforms);
			}
			case 'frankerfacez':
			case 'ffz': {
				return await getFFZEmotes(channelId, platform as Platforms);
			}
			case 'seventv':
			case '7tv': {
				return await get7TVEmotes(channelId, platform as Platforms | 'kick');
			}
			case 'all': {
				const results = await Promise.allSettled([
					getBTTVEmotes(channelId, platform as Platforms),
					getFFZEmotes(channelId, platform as Platforms),
					get7TVEmotes(channelId, platform as Platforms | 'kick')
				]);

				const emotesArrays = results
					.filter((r) => r.status === 'fulfilled')
					.map((r) => (r as PromiseFulfilledResult<ChannelProvider>).value);
				return emotesArrays.flat();
			}
			default:
				throw new Error($format('error.provider'));
		}
	} catch (err) {
		console.error(`[${$format('channel.label')}] ${$format('navbar.emotes')}:`, err);
		throw new Error(
			`[${$format('channel.label')}] ${$format('navbar.emotes')}: ${err instanceof Error ? err.message : $format('error.unknown')}`
		);
	}
}
