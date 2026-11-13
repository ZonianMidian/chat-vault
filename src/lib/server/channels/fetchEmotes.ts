import type { ChannelProvider, Platforms } from '#lib/types/common.ts';

import { getBTTVEmotes } from '#lib/server/providers/bttv.ts';
import { getFFZEmotes } from '#lib/server/providers/ffz.ts';
import { get7TVEmotes } from '#lib/server/providers/7tv.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { ProviderError } from '#lib/server/http.ts';
import { log } from '#lib/server/logger.ts';

type Platform = Platforms | 'kick';
type EmotesFetcher = (channelId: string, platform: Platform) => Promise<ChannelProvider>;

const providers: { name: string; platforms: Platform[]; fetcher: EmotesFetcher }[] = [
	{
		name: 'bttv',
		platforms: ['twitch', 'youtube'],
		fetcher: (id, platform) => getBTTVEmotes(id, platform as Platforms)
	},
	{
		name: 'ffz',
		platforms: ['twitch', 'youtube'],
		fetcher: (id, platform) => getFFZEmotes(id, platform as Platforms)
	},
	{
		name: '7tv',
		platforms: ['twitch', 'youtube', 'kick'],
		fetcher: get7TVEmotes
	}
];

export async function fetchChannelEmotes(
	channelId: string,
	platform: string
): Promise<ChannelProvider[]> {
	const supported = providers.filter(({ platforms }) => platforms.includes(platform as Platform));

	const results = await Promise.all(
		supported.map(({ name, fetcher }) =>
			cached(`channel-emotes:${name}:${platform}:${channelId}`, profiles.live, async () => {
				try {
					return await fetcher(channelId, platform as Platform);
				} catch (err) {
					if (err instanceof ProviderError && err.status === 404) return null;
					throw err;
				}
			}).catch((err: Error) => {
				log.error(
					'Channel',
					`Could not get the ${name} emotes of ${platform}/${channelId}`,
					err
				);
				return null;
			})
		)
	);

	return results.filter((result): result is ChannelProvider => result !== null);
}
