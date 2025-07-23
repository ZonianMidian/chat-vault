import type { Badges } from '$lib/types/common';

import { getTwitchGlobalBadges } from '../providers/twitch';
import { getKickGlobalBadges } from '../providers/kick';
import { $format, getOrCacheData } from '$lib/utils';

const cacheKey = 'globalBadges';
const cacheExpirationKey = 'globalBadgesExp';

const cacheDuration = 60 * 60 * 1000; // 1h

export async function fetchGlobalBadges(provider: string): Promise<Badges[]> {
	try {
		switch (provider.toLowerCase()) {
			case 'twitch':
			case 'ttv':
			case 'tw': {
				return await getTwitchGlobalBadges();
			}
			case 'kick': {
				return await getKickGlobalBadges();
			}
			case 'all': {
				return await getOrCacheData<Badges[]>(
					async () => {
						const results = await Promise.allSettled([
							getTwitchGlobalBadges(),
							getKickGlobalBadges()
						]);

						const BadgesArrays = results
							.filter((r) => r.status === 'fulfilled')
							.map((r) => (r as PromiseFulfilledResult<Badges[]>).value);
						return BadgesArrays.flat();
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
		console.error(`[${$format('global.label')}] ${$format('navbar.badges')}:`, err);
		throw new Error(
			`[${$format('global.label')}] ${$format('navbar.badges')}: ${err instanceof Error ? err.message : $format('error.unknown')}`
		);
	}
}
