import type { User } from '#lib/types/common.ts';

import { searchYouTubeChannel } from '#lib/server/providers/youtube.ts';
import { searchTwitchChannel } from '#lib/server/providers/twitch.ts';
import { searchKickChannel } from '#lib/server/providers/kick.ts';
import { calculateSimilarity } from '#lib/utils/index.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { log } from '#lib/server/logger.ts';

const searchers: Record<string, (search: string) => Promise<User[]>> = {
	twitch: searchTwitchChannel,
	kick: searchKickChannel,
	youtube: searchYouTubeChannel
};

const POSITION_WEIGHT = 0.6;
const SIMILARITY_WEIGHT = 0.4;
const POSITION_SPAN = 20;

function score(term: string, channel: User, position: number): number {
	const name = (channel.username ?? '').toLowerCase();

	if (name === term) return 1 + 1 / (position + 1);

	const relevance = Math.max(0, 1 - position / POSITION_SPAN);

	return POSITION_WEIGHT * relevance + SIMILARITY_WEIGHT * calculateSimilarity(term, name);
}

export function searchChannels(search: string): Promise<User[]> {
	const term = search.trim().toLowerCase();

	return cached(`channel-search:${term}`, profiles.live, async () => {
		const platforms = Object.keys(searchers);
		const results = await Promise.allSettled(platforms.map((name) => searchers[name](term)));

		return results
			.flatMap((result, i) => {
				if (result.status === 'fulfilled') return result.value;

				log.error('Search', `${platforms[i]} is unavailable`, result.reason);
				return [];
			})
			.map((channel, _, all) => {
				const position = all
					.filter((other) => other.platform === channel.platform)
					.indexOf(channel);

				return { channel, score: score(term, channel, position) };
			})
			.sort((a, b) => b.score - a.score)
			.map(({ channel }) => channel);
	});
}
