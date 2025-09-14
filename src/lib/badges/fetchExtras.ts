import type { BadgeRequest, BadgeHistory } from '$lib/types/streamdatabase';
import type { Extras } from '$lib/types/common';

import { $format } from '$lib/utils';

export async function fetchExtras(provider: string, badgeId: string): Promise<Extras> {
	const result: Extras = {
		createdAt: null,
		deletedAt: null,
		related: {
			total: 0,
			list: []
		},
		origin: []
	};

	try {
		if (['twitch', 'kick'].includes(provider) && !/^\d{1,5}$/.test(badgeId)) {
			try {
				const response = await fetch(
					`https://api.streamdatabase.com/twitch/global-badges/${badgeId}`
				);
				if (response.ok) {
					const sdb: BadgeRequest = await response.json();

					const addedEntry = sdb.data.history.find(
						(entry: BadgeHistory) => entry.type === 'added'
					);
					if (addedEntry?.timestamp && !result.createdAt) {
						result.createdAt = new Date(addedEntry.timestamp);
					}

					const removedEntry = [...sdb.data.history]
						.reverse()
						.find((entry: BadgeHistory) => entry.type === 'removed');
					if (removedEntry?.timestamp && !result.deletedAt) {
						result.deletedAt = new Date(removedEntry.timestamp);
					}

					const context = sdb.data.contexts[0];
					if (context) {
						const artist = context.created_by?.twitch?.user
							? context.created_by.twitch.user.display_name ||
								context.created_by.twitch.user.login
							: null;

						result.origin.push({
							source: `https://streamdatabase.com/twitch/global-badges/${badgeId}`,
							provider: 'StreamDatabase',
							text: context.pending_content || context.content || '',
							artist
						});
					}
				}
			} catch {}
		}

		return result;
	} catch (error) {
		console.error(`[${$format('badge.label')}] Extras:`, error);
		return result;
	}
}
