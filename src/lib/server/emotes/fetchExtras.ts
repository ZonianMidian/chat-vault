import type { Emote, Emotes, Extras } from '#lib/types/common.ts';
import type { Data } from '#lib/types/supibot.ts';

import DateData from '#lib/server/emotes/data/dates.json';
import { cached, profiles } from '#lib/server/cache.ts';
import { fetchStreamDatabase } from '#lib/server/streamdatabase.ts';
import { log } from '#lib/server/logger.ts';
import { getOrigins } from './origins';

interface Dates {
	emoteName: string;
	addedAt: string | null;
	removedAt: string | null;
}

const referencePattern = /\[([^\]]+)\]\(([^)]+)\)/g;

export function getBaseEmoteId(emote: Pick<Emote, 'id' | 'provider'>): string {
	return emote.provider === 'twitch' && /_[A-Z]{2}$/.test(emote.id)
		? emote.id.slice(0, -3)
		: emote.id;
}

export function emptyExtras(): Extras {
	return {
		createdAt: null,
		deletedAt: null,
		artist: null,
		image: null,
		tier: null,
		cost: null,
		type: null,
		related: { total: 0, list: [] },
		origin: []
	};
}

async function applyStreamDatabase(result: Extras, emoteId: string): Promise<void> {
	const info = await fetchStreamDatabase('global-emotes', encodeURIComponent(emoteId));
	if (!info) return;

	result.createdAt ??= info.createdAt;
	result.deletedAt ??= info.deletedAt;

	if (info.origin) result.origin.push(info.origin);
}

function applyOrigin(result: Extras, origins: Data[], item: Data, provider: string): void {
	if (item.emoteAdded && !result.createdAt) {
		result.createdAt = new Date(item.emoteAdded);
	}
	if (item.emoteDeleted && !result.deletedAt) {
		result.deletedAt = new Date(item.emoteDeleted);
	}

	result.type = item.origin;

	if (item.origin === 'BITS_BADGE_TIERS') {
		result.cost = item.tier;
	} else if (item.origin === 'SUBSCRIPTIONS') {
		result.tier = item.tier;
	}

	if (provider === 'twitch' && item.artist) {
		result.artist = {
			username: item.artist,
			source: `https://twitch.tv/${item.artist}`,
			platform: 'twitch'
		};
	}

	result.image = item.url;

	const byId = new Map(origins.map((origin) => [String(origin.ID), origin]));

	const mentionedIds = new Set<string>();
	for (const text of [item.text, item.notes]) {
		for (const match of text?.matchAll(referencePattern) ?? []) {
			mentionedIds.add(match[2]);
		}
	}

	const reference = `](${item.ID})`;
	const related: Emotes[] = origins
		.filter(
			(other) =>
				other.ID !== item.ID &&
				!!other.emoteID &&
				(mentionedIds.has(String(other.ID)) ||
					other.text?.includes(reference) ||
					other.notes?.includes(reference) ||
					other.name.toLowerCase() === item.name.toLowerCase())
		)
		.map((other) => ({
			id: other.emoteID as string,
			provider: other.type,
			image: other.url,
			owner: other.artist || null,
			name: other.name
		}));

	result.related = { total: related.length, list: related };

	const linkReferences = (text: string): string =>
		text.replace(referencePattern, (match, name, id) => {
			const target = byId.get(String(id));
			if (!target?.emoteID) return match;

			return `**${name} [[![Emote](https://supinic.com/api/data/origin/image/${id})](/emote/${target.type}/${target.emoteID})]**`;
		});

	result.origin.push({
		source: `https://supinic.com/data/origin/detail/${item.ID}`,
		provider: 'Supibot',
		text: linkReferences(item.text ?? ''),
		notes: item.notes ? linkReferences(item.notes) : null,
		artist: item.reporter || null
	});
}

async function buildExtras(emote: Emote): Promise<Extras> {
	const result = emptyExtras();
	const { provider, name } = emote;
	const emoteId = getBaseEmoteId(emote);

	const dateInfo = (DateData as Record<string, Record<string, Dates>>)[provider]?.[emoteId];
	if (dateInfo?.addedAt) result.createdAt = new Date(dateInfo.addedAt);
	if (dateInfo?.removedAt) result.deletedAt = new Date(dateInfo.removedAt);

	const isTwitchGlobal = provider === 'twitch' && (!emote.owner || emote.owner.id === '12826');

	const [origins] = await Promise.all([
		getOrigins(),
		isTwitchGlobal ? applyStreamDatabase(result, emoteId) : null
	]);

	let matchedItem = origins.find((item) => item.emoteID === emoteId && item.type === provider);

	if (!matchedItem && provider !== 'twitch') {
		matchedItem = origins.find((item) => item.name?.toLowerCase() === name?.toLowerCase());
	}

	if (matchedItem) {
		applyOrigin(result, origins, matchedItem, provider);
	}

	return result;
}

export async function fetchExtras(emote: Emote): Promise<Extras> {
	try {
		return await cached(`emote-extras:${emote.provider}:${emote.id}`, profiles.extras, () =>
			buildExtras(emote)
		);
	} catch (err) {
		log.error('Emote', `Could not get the extras of ${emote.provider}/${emote.id}`, err);
		return emptyExtras();
	}
}
