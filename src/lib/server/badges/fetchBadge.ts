import type { BadgeContext } from '#lib/server/providers/context.ts';
import type { Translator } from '#lib/server/i18n.ts';
import type { Badge } from '#lib/types/common.ts';

import { resolveProvider, type Provider } from '#lib/providers.ts';
import { getYouTubeBadge } from '#lib/server/providers/youtube.ts';
import { getTwitchBadge } from '#lib/server/providers/twitch.ts';
import { getKickBadge } from '#lib/server/providers/kick.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';
import { fetchAllGlobalBadges } from './fetchGlobals';

type BadgeFetcher = (badgeId: string, ctx: BadgeContext) => Promise<Badge>;

const fetchers: Partial<Record<Provider, BadgeFetcher>> = {
	twitch: getTwitchBadge,
	kick: getKickBadge,
	youtube: getYouTubeBadge
};

const selfCached: Provider[] = ['youtube'];

export interface BadgeRef {
	provider: Provider;
	id: string;
}

export function resolveBadge(provider: string, badgeId: string): BadgeRef {
	const canonical = resolveProvider(provider);
	if (!canonical || !fetchers[canonical]) throw new RequestError(400, 'error.provider');

	return { provider: canonical, id: badgeId };
}

export function fetchBadge({ provider, id }: BadgeRef, i18n: Translator): Promise<Badge> {
	const fetcher = fetchers[provider];
	if (!fetcher) return Promise.reject(new RequestError(400, 'error.provider'));

	const load = async (): Promise<Badge> =>
		fetcher(id, { i18n, globals: await fetchAllGlobalBadges(i18n) });

	return selfCached.includes(provider)
		? load()
		: cached(`badge:${provider}:${id}:${i18n.locale}`, profiles.entity, load);
}
