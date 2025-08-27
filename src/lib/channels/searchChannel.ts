import type { User } from '$lib/types/common';

import { searchTwitchChannel } from '$lib/providers/twitch';
import { searchKickChannel } from '$lib/providers/kick';

import { $format } from '$lib/utils';

export async function searchChannel(
	provider: string,
	userName: string,
	limit?: number
): Promise<User[]> {
	try {
		switch (provider.toLowerCase()) {
			case 'twitch':
			case 'ttv':
			case 'tw': {
				return await searchTwitchChannel(userName, limit);
			}
			case 'kick': {
				return await searchKickChannel(userName, limit);
			}
			case 'all': {
				const results = await Promise.allSettled([
					searchTwitchChannel(userName, limit),
					searchKickChannel(userName, limit)
				]);

				const emotesArrays = results
					.filter((r) => r.status === 'fulfilled')
					.map((r) => (r as PromiseFulfilledResult<User[]>).value);
				return emotesArrays.flat();
			}
			default:
				throw new Error($format('error.provider'));
		}
	} catch (err) {
		console.error(`[${$format('channel.label')}] ${$format('search.label')}:`, err);
		throw new Error(err instanceof Error ? err.message : $format('error.unknown'));
	}
}
