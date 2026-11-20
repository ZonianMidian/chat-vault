import type { Emote, Emotes, Channels, ChannelProvider, Set } from '#lib/types/common.ts';
import type { BTTVEmote, BTTVChannels, BTTVGlobals, BTTVUser } from '#lib/types/bttv.ts';
import type { EmoteSearchOptions, SearchEmote } from '#lib/emotes/search.ts';
import type { PageRequest, SearchPage } from '#lib/server/emotes/pages.ts';

import { ProviderError, requestJson, requestOk } from '#lib/server/http.ts';
import EmoteAuthor from '#lib/server/emotes/data/bttvGlobals.json';
import { compareName, objectIdDate } from '#lib/utils/index.ts';
import { toOffset } from '#lib/server/emotes/pages.ts';
import { config } from '#lib/server/config.ts';

const API = 'https://api.betterttv.net/3';

const options = {
	headers: {
		Origin: 'https://betterttv.com',
		Referer: 'https://betterttv.com/',
		...(config.auth.betterttv && { Authorization: `Bearer ${config.auth.betterttv}` })
	}
};

const zeroWidthEmotes = [
	'567b5b520e984428652809b6', // SoSnowy
	'5849c9a4f52be01a7ee5f79d', // IceCold
	'58487cc6f52be01a7ee5f205', // SantaHat
	'5849c9c8f52be01a7ee5f79e', // TopHat
	'567b5dc00e984428652809bd', // ReinDeer
	'567b5c080e984428652809ba', // CandyCane
	'5e76d399d6581c3724c0f0b8', // cvMask
	'5e76d338d6581c3724c0f0b2' // cvHazmat
];

const emoteImage = (emoteId: string, scale = 3): string =>
	`https://cdn.betterttv.net/emote/${emoteId}/${scale}x.webp`;

function transformEmotes(data: BTTVUser): Emotes[] {
	const allEmotes = [
		...(Array.isArray(data.channelEmotes) ? data.channelEmotes : []),
		...(Array.isArray(data.sharedEmotes) ? data.sharedEmotes : [])
	];

	return allEmotes.map((emote) => ({
		id: emote.id,
		name: emote.code,
		owner: emote.user ? compareName(emote.user.name, emote.user.displayName) : null,
		image: emoteImage(emote.id),
		zero_width: zeroWidthEmotes.includes(emote.id),
		provider: 'bttv'
	}));
}

export async function getBTTVEmote(emoteId: string): Promise<Emote> {
	const source = '[BetterTTV] Emote';
	const data = await requestJson<BTTVEmote>(
		source,
		`${API}/emotes/${encodeURIComponent(emoteId)}`,
		options
	);

	if (!data?.user) {
		throw new ProviderError(source, 404);
	}

	return {
		id: emoteId,
		name: data.code,
		provider: 'bttv',
		tags: [],
		artist:
			data.attribution && data.attribution.toLowerCase() !== data.user.name
				? {
						avatar: `https://api.spanix.team/avatar/login/${data.attribution}/150`,
						source: `https://twitch.tv/${data.user.id}`,
						username: data.attribution,
						platform: 'twitch'
					}
				: null,
		owner: {
			id: data.user.providerId,
			avatar: `https://api.spanix.team/avatar/id/${data.user.providerId}/150`,
			source: `https://betterttv.com/users/${data.user.id}`,
			username: compareName(data.user.name, data.user.displayName),
			platform: 'twitch'
		},
		images: [1, 2, 3].map((scale) => emoteImage(emoteId, scale)),
		source: `https://betterttv.com/emotes/${emoteId}`,
		createdAt: data.createdAt,
		approved: data.approvalStatus === 'APPROVED' || data.approvalStatus === 'AUTO_APPROVED',
		type: data.global ? 'GLOBALS' : 'CHANNEL',
		public: data.sharing,
		animated: data.animated,
		zero_width: zeroWidthEmotes.includes(emoteId),
		global: data.global,
		deleted: false,
		channels: await getBTTVChannels(emoteId).catch(() => ({ total: 0, list: [] }))
	};
}

export async function getBTTVChannels(
	emoteId: string,
	before: string | null = null
): Promise<Channels> {
	const source = '[BetterTTV] Channels';
	const url = new URL(`${API}/emotes/${encodeURIComponent(emoteId)}/shared`);
	if (before) {
		url.searchParams.append('before', before);
	}

	const res = await requestOk(source, url, options);
	const data: BTTVChannels[] = await res.json().catch(() => null);

	if (!Array.isArray(data)) {
		throw new ProviderError(source, 500);
	}

	return {
		total: Number(res.headers.get('x-total')) || 0,
		list: data.map((item) => ({
			id: item.user.providerId,
			posId: item.id,
			avatar: item.user.avatar,
			username: compareName(item.user.name, item.user.displayName),
			platform: 'twitch'
		}))
	};
}

export async function getBTTVGlobalEmotes(): Promise<Emotes[]> {
	const source = '[BetterTTV] Global Emotes';
	const data = await requestJson<BTTVGlobals[]>(source, `${API}/cached/emotes/global`, options);

	if (!Array.isArray(data)) {
		throw new ProviderError(source, 500);
	}

	return data.map((emote) => ({
		id: emote.id,
		name: emote.code,
		image: emoteImage(emote.id),
		owner: EmoteAuthor[emote.id as keyof typeof EmoteAuthor] || 'NightDev',
		zero_width: zeroWidthEmotes.includes(emote.id),
		provider: 'bttv'
	}));
}

export async function getBTTVEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' = 'twitch'
): Promise<ChannelProvider> {
	const source = '[BetterTTV] Emotes';
	const data = await requestJson<BTTVUser>(
		source,
		`${API}/cached/users/${platform}/${encodeURIComponent(userId)}`,
		options
	);

	if (!data) {
		throw new ProviderError(source, 404);
	}

	return {
		provider: 'bttv',
		bots: data.bots || [],
		sets: [
			{
				id: data.id.toString(),
				name: null,
				subtitle: null,
				mainSet: true,
				tags: [],
				source: `https://betterttv.com/users/${data.id}`,
				provider: 'bttv',
				owner: {
					id: userId.toString(),
					username: null,
					source: `https://betterttv.com/users/${data.id}`,
					avatar: data.avatar,
					platform
				},
				emotes: transformEmotes(data)
			}
		]
	};
}

const SEARCH_LIMIT = 100;

function searchEmote(
	emote: Pick<BTTVEmote, 'id' | 'code' | 'animated'> & {
		user?: BTTVEmote['user'];
		createdAt?: Date | string;
	}
): SearchEmote {
	return {
		id: emote.id,
		name: emote.code,
		image: emoteImage(emote.id),
		owner: emote.user ? compareName(emote.user.name, emote.user.displayName) : null,
		zero_width: zeroWidthEmotes.includes(emote.id),
		animated: emote.animated,
		createdAt: emote.createdAt
			? new Date(emote.createdAt).toISOString()
			: objectIdDate(emote.id),
		provider: 'bttv'
	};
}

async function searchZeroWidth(query: string, exact: boolean): Promise<SearchPage> {
	const source = '[BetterTTV] Overlay Emotes';
	const found = await Promise.allSettled(
		zeroWidthEmotes.map((id) => requestJson<BTTVEmote>(source, `${API}/emotes/${id}`, options))
	);

	const data = found.flatMap((result) =>
		result.status === 'fulfilled' && result.value?.id ? [result.value] : []
	);
	if (!data.length) throw new ProviderError(source, 502);

	const term = query.toLowerCase();

	return {
		next: null,
		emotes: data
			.filter((emote) => {
				const name = emote.code.toLowerCase();
				return !term || (exact ? name === term : name.includes(term));
			})
			.map((emote) => ({
				...searchEmote(emote),
				owner: EmoteAuthor[emote.id as keyof typeof EmoteAuthor] || 'NightDev'
			}))
	};
}

export async function searchBTTVEmotes(
	search: EmoteSearchOptions,
	page: PageRequest
): Promise<SearchPage> {
	const query = search.query.trim();

	if (search.zeroWidth) {
		return page.cursor ? { emotes: [], next: null } : searchZeroWidth(query, search.exact);
	}

	if (!query) {
		const source = '[BetterTTV] Trending';
		const url = new URL(`${API}/emotes/shared/trending`);
		const limit = Math.min(page.count * (search.format === 'all' ? 1 : 2), SEARCH_LIMIT);
		url.searchParams.set('limit', String(limit));
		if (page.cursor) url.searchParams.set('before', page.cursor);

		const data = await requestJson<({ emote: BTTVEmote } & { id: string })[]>(
			source,
			url,
			options
		);
		if (!Array.isArray(data)) throw new ProviderError(source, 502);

		return {
			emotes: data.map(({ emote }) => searchEmote(emote)),
			next: data.length === limit ? (data.at(-1)?.id ?? null) : null
		};
	}

	const source = '[BetterTTV] Search';
	const offset = toOffset(page.cursor);
	const limit = search.exact ? SEARCH_LIMIT : Math.min(page.count, SEARCH_LIMIT);

	const url = new URL(`${API}/emotes/shared/search`);
	url.search = new URLSearchParams({
		query,
		offset: String(offset),
		limit: String(limit),
		type: search.format,
		personal: String(search.personal)
	}).toString();

	const data = await requestJson<BTTVEmote[]>(source, url, options);
	if (!Array.isArray(data)) throw new ProviderError(source, 502);

	return {
		emotes: data.map(searchEmote),
		next: data.length === limit ? String(offset + data.length) : null
	};
}

export async function getBTTVSet(setId: string): Promise<Set> {
	const source = '[BetterTTV] Set';
	const data = await requestJson<BTTVUser>(
		source,
		`${API}/users/${encodeURIComponent(setId)}`,
		options
	);

	if (!data) {
		throw new ProviderError(source, 404);
	}

	const userName =
		data.name && data.displayName ? compareName(data.name, data.displayName) : 'BetterTTV';

	return {
		id: data.id,
		name: null,
		subtitle: null,
		tags: [],
		source: `https://betterttv.net/users/${data.id}`,
		provider: 'bttv',
		owner: {
			id: data.providerId,
			username: userName,
			avatar: `https://api.spanix.team/avatar/id/${data.providerId}/150`,
			source: `https://betterttv.net/users/${data.id}`,
			platform: 'twitch'
		},
		emotes: transformEmotes(data)
	};
}
