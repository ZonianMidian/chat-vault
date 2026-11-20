import type { EmoteContext } from '#lib/server/providers/context.ts';
import type { Emote } from '#lib/types/common.ts';

import { canonicalId, resolveProvider, type Provider } from '#lib/providers.ts';
import { getYouTubeEmote } from '#lib/server/providers/youtube.ts';
import { getTwitchEmote } from '#lib/server/providers/twitch.ts';
import { getBTTVEmote } from '#lib/server/providers/bttv.ts';
import { getKickEmote } from '#lib/server/providers/kick.ts';
import { getFFZEmote } from '#lib/server/providers/ffz.ts';
import { get7TVEmote } from '#lib/server/providers/7tv.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';
import { findGlobalEmote } from './fetchGlobals';
import { getOrigins } from './origins';

type EmoteFetcher = (emoteId: string, ctx: EmoteContext) => Promise<Emote>;

const fetchers: Record<Provider, EmoteFetcher> = {
	twitch: getTwitchEmote,
	youtube: getYouTubeEmote,
	kick: getKickEmote,
	bttv: getBTTVEmote,
	ffz: getFFZEmote,
	'7tv': get7TVEmote
};

const selfCached: Provider[] = ['youtube'];

export interface EmoteRef {
	provider: Provider;
	id: string;
}

export function resolveEmote(provider: string, emoteId: string): EmoteRef {
	const canonical = resolveProvider(provider);
	if (!canonical) throw new RequestError(400, 'error.provider');

	return { provider: canonical, id: canonicalId(canonical, emoteId) };
}

export function fetchEmote({ provider, id }: EmoteRef): Promise<Emote> {
	const load = async (): Promise<Emote> => {
		const [global, origins] = await Promise.all([
			findGlobalEmote(id, provider),
			provider === 'twitch' ? getOrigins() : []
		]);

		return fetchers[provider](id, { global, origins });
	};

	return selfCached.includes(provider)
		? load()
		: cached(`emote:${provider}:${id}`, profiles.entity, load);
}
