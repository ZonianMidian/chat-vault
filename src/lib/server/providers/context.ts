import type { Badges, Emotes } from '#lib/types/common.ts';
import type { Translator } from '#lib/server/i18n.ts';
import type { Data } from '#lib/types/supibot.ts';

export interface EmoteContext {
	global: Emotes | null;
	origins: Data[];
}

export interface BadgeContext {
	i18n: Translator;
	globals: Badges[];
}

export interface RelatedBadges {
	badge: Badges | null;
	related: Badges[];
}

export function findGlobalBadge(
	globals: Badges[],
	badgeId: string,
	badgeVersion: string,
	provider: string,
	includeSelf = false
): RelatedBadges {
	if (!badgeId || !badgeVersion || !provider) {
		return { badge: null, related: [] };
	}

	const badge =
		globals.find(
			(item) =>
				item.id === badgeId && item.version === badgeVersion && item.provider === provider
		) ?? null;

	const related = globals
		.filter((item) => item.id === badgeId && (includeSelf || item.version !== badgeVersion))
		.sort((a, b) => Number(b.provider === provider) - Number(a.provider === provider));

	return { badge, related };
}
