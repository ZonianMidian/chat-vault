import { getOrCacheData, objectIdToUlid } from '../utils';
import type { Data, Origin } from '$lib/types/supibot';

const cacheExpirationKey = 'originDataExp';
const cacheKey = 'originData';

const cacheDuration = 24 * 60 * 60 * 1000; // 24h

export async function getCachedOriginData(): Promise<Data[]> {
	return getOrCacheData<Data[]>(
		async () => {
			try {
				const response = await fetch('https://supinic.com/api/data/origin/list');
				if (!response.ok) {
					throw new Error();
				}
				const jsonData: Origin = await response.json();
				return jsonData.data.map((item) => ({
					ID: item.ID,
					emoteID:
						item.emoteID?.length === 24 && item.type.startsWith('7TV')
							? objectIdToUlid(item.emoteID)
							: item.emoteID,
					name: item.name,
					type: item.type?.split(' ')[0].toLowerCase(),
					tier: item.tier ? Number(item.tier) : null,
					text: item.text,
					notes: item.notes,
					emoteAdded: item.emoteAdded,
					emoteDeleted: item.emoteDeleted,
					artist: item.artist || null,
					reporter: item.reporter,
					url: item.url
				}));
			} catch (error) {
				console.error('[Supinic]:', error);
				return null;
			}
		},
		cacheKey,
		cacheExpirationKey,
		cacheDuration,
		[]
	);
}
