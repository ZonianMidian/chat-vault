import type { Data, Origin, OriginData } from '#lib/types/supibot.ts';

import { cached, profiles } from '#lib/server/cache.ts';
import { requestJson } from '#lib/server/http.ts';
import { log } from '#lib/server/logger.ts';
import { isObjectId, objectIdToUlid } from '#lib/utils/index.ts';

const getOriginType = (type: string): string | null => {
	switch (type) {
		case 'Bits':
			return 'BITS_BADGE_TIERS';
		case 'Sub':
			return 'SUBSCRIPTIONS';
		case 'Global':
			return 'GLOBALS';
		case 'Follower':
			return 'FOLLOWER';
		default:
			return null;
	}
};

function normalize(item: OriginData): Data {
	const emoteId = item.emoteId ?? item.emoteID ?? null;
	const type = item.type ?? '';

	return {
		ID: item.ID,
		emoteID:
			emoteId && type.startsWith('7TV') && isObjectId(emoteId)
				? objectIdToUlid(emoteId)
				: emoteId,
		name: item.name,
		type: type.split(' ')[0].toLowerCase(),
		origin: getOriginType(type.split(' ').slice(-1)[0]),
		tier: item.tier ? Number(item.tier) : null,
		text: item.text,
		notes: item.notes,
		emoteAdded: item.emoteAdded,
		emoteDeleted: item.emoteDeleted,
		artist: item.authorName ?? item.artist ?? null,
		reporter: item.reporterName ?? item.reporter ?? null,
		url: item.url
	};
}

export async function getOrigins(): Promise<Data[]> {
	try {
		return await cached('origins', profiles.origins, async () => {
			const json = await requestJson<Origin>(
				'[Supibot] Origins',
				'https://supinic.com/api/data/origin/list',
				{ timeout: 30000 }
			);

			return json.data.map(normalize);
		});
	} catch (err) {
		log.error('Supibot', 'Origins are unavailable, continuing without them', err);
		return [];
	}
}

export function findOrigin(origins: Data[], emoteId: string, type: string): Data | null {
	return origins.find((item) => item.emoteID === emoteId && item.type === type) ?? null;
}
