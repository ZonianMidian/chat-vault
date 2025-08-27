import type { ChannelData } from '$lib/types/common';

import { getTwitchChannel } from '$lib/providers/twitch';
import { getKickChannel } from '$lib/providers/kick';
import { $format, updateURLPath } from '$lib/utils';
import { browser } from '$app/environment';

type ChannelFetcher = (emoteId: string) => Promise<ChannelData>;

const providerMap: Record<string, { canonical: string; fetcher: ChannelFetcher }> = {
	twitch: { canonical: 'twitch', fetcher: getTwitchChannel },
	ttv: { canonical: 'twitch', fetcher: getTwitchChannel },
	tw: { canonical: 'twitch', fetcher: getTwitchChannel },

	kick: { canonical: 'kick', fetcher: getKickChannel }
};

export async function fetchChannel(platform: string, channelLogin: string): Promise<ChannelData> {
	try {
		const key = platform.toLowerCase();
		const entry = providerMap[key];

		if (!entry) throw new Error($format('error.provider'));

		const { canonical, fetcher } = entry;

		if (key !== canonical && browser) {
			updateURLPath(platform, canonical);
		}

		return await fetcher(channelLogin);
	} catch (err) {
		console.error(`[${$format('channel.label')}] ${$format('common.platform')}:`, err);
		throw new Error(err instanceof Error ? err.message : $format('error.unknown'));
	}
}
