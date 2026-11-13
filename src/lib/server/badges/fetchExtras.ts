import type { Badge, Extras } from '#lib/types/common.ts';

import { fetchStreamDatabase } from '#lib/server/streamdatabase.ts';
import DateData from '#lib/server/badges/data/dates.json';
import { customBadges } from '#lib/server/providers/twitch.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { log } from '#lib/server/logger.ts';

interface Dates {
	badgeName: string | null;
	addedAt: string | null;
	removedAt: string | null;
}

function emptyExtras(): Extras {
	return {
		createdAt: null,
		deletedAt: null,
		related: { total: 0, list: [] },
		origin: []
	};
}

async function buildExtras(badge: Badge): Promise<Extras> {
	const result = emptyExtras();

	const { provider } = badge;
	const version = badge.version.split('/')[0];
	const badgeId = `${badge.id}${version ? `/${version}` : ''}`;
	const channel = badge.owner?.username?.toLowerCase();

	if (!['twitch', 'kick'].includes(provider) || /^\d{1,5}$/.test(badgeId)) {
		return result;
	}

	const dateInfo = (DateData as Record<string, Record<string, Dates>>)[provider]?.[badge.id];
	if (dateInfo?.addedAt) result.createdAt = new Date(dateInfo.addedAt);
	if (dateInfo?.removedAt) result.deletedAt = new Date(dateInfo.removedAt);

	if (provider !== 'twitch') return result;

	const info =
		channel && customBadges.includes(badge.id)
			? await fetchStreamDatabase(
					'channel-badges',
					`${encodeURIComponent(channel)}/${badgeId}`
				)
			: await fetchStreamDatabase('global-badges', badgeId);

	if (info) {
		result.createdAt = info.createdAt ?? result.createdAt;
		result.deletedAt ??= info.deletedAt;

		if (info.origin) result.origin.push(info.origin);
	}

	return result;
}

export async function fetchExtras(badge: Badge): Promise<Extras> {
	try {
		return await cached(
			`badge-extras:${badge.provider}:${badge.id}:${badge.version}`,
			profiles.extras,
			() => buildExtras(badge)
		);
	} catch (err) {
		log.error('Badge', `Could not get the extras of ${badge.provider}/${badge.id}`, err);
		return emptyExtras();
	}
}
