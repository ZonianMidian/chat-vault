import type { Translator } from '#lib/server/i18n.ts';
import type { Badges } from '#lib/types/common.ts';

import { getTwitchGlobalBadges } from '#lib/server/providers/twitch.ts';
import { getKickGlobalBadges } from '#lib/server/providers/kick.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { log } from '#lib/server/logger.ts';

type BadgeProvider = 'twitch' | 'kick';

const fetchers: Record<BadgeProvider, (i18n: Translator) => Promise<Badges[]>> = {
	twitch: (i18n) =>
		cached(`globals:badges:twitch:${i18n.locale}`, profiles.globals, () =>
			getTwitchGlobalBadges(i18n)
		),
	kick: async (i18n) => getKickGlobalBadges(i18n)
};

export async function fetchAllGlobalBadges(i18n: Translator): Promise<Badges[]> {
	const providers = Object.keys(fetchers) as BadgeProvider[];
	const results = await Promise.allSettled(providers.map((provider) => fetchers[provider](i18n)));

	return results.flatMap((result, i) => {
		if (result.status === 'fulfilled') return result.value;

		log.error('Global Badges', `${providers[i]} is unavailable`, result.reason);
		return [];
	});
}
