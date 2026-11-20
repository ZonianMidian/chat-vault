import type { Set } from '#lib/types/common.ts';

import { canonicalId, resolveProvider, type Provider } from '#lib/providers.ts';
import { getTwitchSet } from '#lib/server/providers/twitch.ts';
import { getBTTVSet } from '#lib/server/providers/bttv.ts';
import { getFFZSet } from '#lib/server/providers/ffz.ts';
import { get7TVSet } from '#lib/server/providers/7tv.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';

type SetFetcher = (setId: string) => Promise<Set>;

const fetchers: Partial<Record<Provider, SetFetcher>> = {
	twitch: getTwitchSet,
	bttv: getBTTVSet,
	ffz: getFFZSet,
	'7tv': get7TVSet
};

export interface SetRef {
	provider: Provider;
	id: string;
}

export function resolveSet(provider: string, setId: string): SetRef {
	const canonical = resolveProvider(provider);
	if (!canonical || !fetchers[canonical]) throw new RequestError(400, 'error.provider');

	return { provider: canonical, id: canonicalId(canonical, setId) };
}

export function fetchSet({ provider, id }: SetRef): Promise<Set> {
	const fetcher = fetchers[provider];
	if (!fetcher) return Promise.reject(new RequestError(400, 'error.provider'));

	return cached(`set:${provider}:${id}`, profiles.entity, () => fetcher(id));
}
