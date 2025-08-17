import type { EmoteRequest, EmoteHistory } from '$lib/types/streamdatabase';
import type { Extras } from '$lib/types/common';
import type { Data } from '$lib/types/supibot';

import { getCachedOriginData } from '$lib/emotes/originCache';
import DateData from '$lib/emotes/data/dates.json';
import { $format } from '$lib/utils';

export async function fetchExtras(
	channelId: string | null,
	provider: string,
	emoteId: string,
	emoteName: string
): Promise<Extras> {
	const result: Extras = {
		createdAt: null,
		deletedAt: null,
		artist: null,
		image: null,
		tier: null,
		cost: null,
		type: null,
		related: {
			total: 0,
			list: []
		},
		origin: []
	};

	try {
		const supi: Data[] = await getCachedOriginData();

		interface Dates {
			emoteName: string;
			addedAt: string | null;
			removedAt: string | null;
		}

		if ((DateData[provider as keyof typeof DateData] as Record<string, Dates>)?.[emoteId]) {
			const dateInfo = (DateData[provider as keyof typeof DateData] as Record<string, Dates>)[
				emoteId
			];

			if (dateInfo.addedAt && !result.createdAt) {
				result.createdAt = new Date(dateInfo.addedAt);
			}
			if (dateInfo.removedAt && !result.deletedAt) {
				result.deletedAt = new Date(dateInfo.removedAt);
			}
		}

		if (provider === 'twitch' && channelId === '12826') {
			try {
				const response = await fetch(
					`https://api.streamdatabase.com/twitch/global-emotes/${emoteId}`
				);
				if (response.ok) {
					const sdb: EmoteRequest = await response.json();

					const addedEntry = sdb.data.history.find(
						(entry: EmoteHistory) => entry.type === 'added'
					);
					if (addedEntry?.timestamp && !result.createdAt) {
						result.createdAt = new Date(addedEntry.timestamp);
					}

					const removedEntry = [...sdb.data.history]
						.reverse()
						.find((entry: EmoteHistory) => entry.type === 'removed');
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
							source: `https://streamdatabase.com/twitch/global-emotes/${emoteId}`,
							provider: 'StreamDatabase',
							text: context.content || context.pending_content || '',
							artist
						});
					}
				}
			} catch {}
		}

		let matchedItem = supi.find((item) => item.emoteID === emoteId && item.type === provider);

		if (!matchedItem) {
			matchedItem = supi.find(
				(item) => item.name?.toLowerCase() === emoteName?.toLowerCase()
			);
		}

		if (matchedItem) {
			if (matchedItem.emoteAdded && !result.createdAt) {
				result.createdAt = new Date(matchedItem.emoteAdded);
			}
			if (matchedItem.emoteDeleted && !result.deletedAt) {
				result.deletedAt = new Date(matchedItem.emoteDeleted);
			}

			result.type = matchedItem.origin;

			if (matchedItem.origin === 'BITS_BADGE_TIERS') {
				result.cost = matchedItem.tier;
			} else if (matchedItem.origin === 'SUBSCRIPTIONS') {
				result.tier = matchedItem.tier;
			}

			if (provider === 'twitch' && matchedItem.artist) {
				result.artist = {
					username: matchedItem.artist,
					source: `https://twitch.tv/${matchedItem.artist}`,
					platform: 'twitch'
				};
			}

			result.image = matchedItem.url;

			const mentionedIds = new Set<string>();
			const idPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

			const textMatches = matchedItem.text?.matchAll(idPattern) || [];
			for (const match of textMatches) {
				mentionedIds.add(match[2]);
			}

			const notesMatches = matchedItem.notes?.matchAll(idPattern) || [];
			for (const match of notesMatches) {
				mentionedIds.add(match[2]);
			}

			const relatedList = supi.filter(
				(item: Data) =>
					item.ID !== matchedItem.ID &&
					(mentionedIds.has(String(item.ID)) ||
						(item.text && item.text.includes(`](${matchedItem.ID})`)) ||
						(item.notes && item.notes.includes(`](${matchedItem.ID})`)) ||
						item.name.toLowerCase() === matchedItem.name.toLowerCase())
			);

			result.related.list = relatedList.map((relatedItem: Data) => ({
				id: relatedItem.emoteID,
				provider: relatedItem.type,
				image: relatedItem.url,
				owner: relatedItem.artist || null,
				name: relatedItem.name
			}));

			result.related.total = result.related.list.length;

			function replaceWithMarkdown(str: string): string {
				return str.replace(idPattern, (match, name, id) => {
					const data = supi.find((item) => String(item.ID) === String(id));
					if (!data) return match;

					const linkProvider = data.type;
					const linkId = data.emoteID;

					return `**${name} [[![Emote](https://supinic.com/api/data/origin/image/${id})](/emote/${linkProvider}/${linkId})]**`;
				});
			}

			const patchedText = replaceWithMarkdown(matchedItem.text);
			const patchedNotes = matchedItem.notes ? replaceWithMarkdown(matchedItem.notes) : null;

			result.origin.push({
				source: `https://supinic.com/data/origin/detail/${matchedItem.ID}`,
				provider: 'Supibot',
				text: patchedText,
				notes: patchedNotes,
				artist: matchedItem.reporter || null
			});
		}

		return result;
	} catch (error) {
		console.error(`[${$format('emote.label')}] Extras:`, error);
		return result;
	}
}
