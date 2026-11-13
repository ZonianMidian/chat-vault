import type { Translator } from '#lib/server/i18n.ts';
import type { ChannelData } from '#lib/types/common.ts';

import { resolveProvider, type Provider } from '#lib/providers.ts';
import { getYouTubeChannel, resolveYouTubeChannelId } from '#lib/server/providers/youtube.ts';
import { getTwitchChannel } from '#lib/server/providers/twitch.ts';
import { getKickChannel } from '#lib/server/providers/kick.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';

type ChannelFetcher = (login: string, i18n: Translator) => Promise<ChannelData>;

const fetchers: Partial<Record<Provider, ChannelFetcher>> = {
	twitch: getTwitchChannel,
	kick: getKickChannel,
	youtube: getYouTubeChannel
};

export interface ChannelRef {
	provider: Provider;
	login: string;
}

export async function resolveChannel(platform: string, login: string): Promise<ChannelRef> {
	const canonical = resolveProvider(platform);
	if (!canonical || !fetchers[canonical]) throw new RequestError(400, 'error.provider');

	return {
		provider: canonical,
		login: canonical === 'youtube' ? await resolveYouTubeChannelId(login) : login.toLowerCase()
	};
}

export function fetchChannel(
	{ provider, login }: ChannelRef,
	i18n: Translator
): Promise<ChannelData> {
	const fetcher = fetchers[provider];
	if (!fetcher) return Promise.reject(new RequestError(400, 'error.provider'));

	return cached(`channel:${provider}:${login}:${i18n.locale}`, profiles.live, () =>
		fetcher(login, i18n)
	);
}
