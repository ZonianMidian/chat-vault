import type { BTTVEmote, BTTVChannels, BTTVGlobals, BTTVUser } from '$lib/types/bttv';
import type { Emote, Emotes, Channels, ChannelProvider, Set } from '$lib/types/common';

import EmoteAuthor from '$lib/emotes/data/bttvGlobals.json';
import { $format, compareName } from '$lib/utils';

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

export async function getBTTVEmote(emoteId: string): Promise<Emote> {
	const url = `https://api.betterttv.net/3/emotes/${encodeURIComponent(emoteId)}`;

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		const message =
			res.status === 404 ? $format('status.404') : error.message || res.statusText;
		throw new Error(`[BetterTTV] Emote | ${res.status}: ${message}`);
	}

	const data: BTTVEmote = await res.json();
	if (!data) {
		throw new Error(`[BetterTTV] Emote | 404: ${$format('status.404')}`);
	}

	const userName = compareName(data.user.name, data.user.displayName);

	return {
		id: emoteId,
		name: data.code,
		provider: 'bttv',
		tags: [],
		artist: null,
		owner: {
			id: data.user.providerId,
			avatar: `https://cdn.frankerfacez.com/avatar/twitch/${data.user.providerId}`,
			source: `https://betterttv.com/users/${data.user.id}`,
			username: userName,
			platform: 'twitch'
		},
		images: [
			`https://cdn.betterttv.net/emote/${emoteId}/1x.webp`,
			`https://cdn.betterttv.net/emote/${emoteId}/2x.webp`,
			`https://cdn.betterttv.net/emote/${emoteId}/3x.webp`
		],
		source: `https://betterttv.com/emotes/${emoteId}`,
		createdAt: data.createdAt,
		approved: data.approvalStatus === 'APPROVED' || data.approvalStatus === 'AUTO_APPROVED',
		type: data.global ? 'GLOBAL' : 'CHANNEL',
		public: data.sharing,
		animated: data.animated,
		zeroWidth: zeroWidthEmotes.includes(emoteId),
		channels: await getBTTVChannels(emoteId)
	};
}

export async function getBTTVChannels(
	emoteId: string,
	before: string | null = null
): Promise<Channels> {
	const url = new URL(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emoteId)}/shared`);
	if (before) {
		url.searchParams.append('before', before);
	}

	const res = await fetch(url.toString());
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`[BetterTTV] Channels | ${res.status}: ${error.message || res.statusText}`);
	}

	const data: BTTVChannels[] = await res.json();
	if (!Array.isArray(data)) {
		throw new Error(`[BetterTTV] Channels | 500: ${$format('status.500')}`);
	}

	return {
		total: Number(res.headers.get('x-total')) || 0,
		list: data.map((item: BTTVChannels) => ({
			id: item.user.providerId,
			posId: item.id,
			avatar: item.user.avatar,
			username: compareName(item.user.name, item.user.displayName),
			platform: 'twitch'
		}))
	};
}

export async function getBTTVGlobalEmotes(): Promise<Emotes[]> {
	const url = 'https://api.betterttv.net/3/cached/emotes/global';

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(
			`[BetterTTV] Global Emotes | ${res.status}: ${error.message || res.statusText}`
		);
	}

	const data: BTTVGlobals[] = await res.json();
	if (!Array.isArray(data)) {
		throw new Error(`[BetterTTV] Global Emotes | 500: ${$format('status.500')}`);
	}

	return data.map((emote) => ({
		id: emote.id,
		name: emote.code,
		image: `https://cdn.betterttv.net/emote/${emote.id}/3x.webp`,
		owner: EmoteAuthor[emote.id as keyof typeof EmoteAuthor] || 'NightDev',
		zeroWidth: zeroWidthEmotes.includes(emote.id),
		provider: 'bttv'
	}));
}

export async function getBTTVEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' = 'twitch'
): Promise<ChannelProvider> {
	const url = `https://api.betterttv.net/3/cached/users/${platform}/${encodeURIComponent(userId)}`;

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`[BetterTTV] Emotes | ${res.status}: ${error.message || res.statusText}`);
	}

	const data: BTTVUser = await res.json();
	if (!data) {
		throw new Error(`[BetterTTV] Emotes | 404: ${$format('status.404')}`);
	}

	const allEmotes = [
		...(Array.isArray(data.channelEmotes) ? data.channelEmotes : []),
		...(Array.isArray(data.sharedEmotes) ? data.sharedEmotes : [])
	];

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
				emotes: allEmotes.map((emote) => ({
					id: emote.id,
					name: emote.code,
					owner: emote.user ? compareName(emote.user.name, emote.user.displayName) : null,
					image: `https://cdn.betterttv.net/emote/${emote.id}/3x.webp`,
					zeroWidth: zeroWidthEmotes.includes(emote.id),
					provider: 'bttv'
				}))
			}
		]
	};
}

export async function getBTTVSet(setId: string): Promise<Set> {
	// const url = `https://api.betterttv.net/3/emote_sets/${setId}`;
	const url = `https://api.betterttv.net/3/users/${setId}`;

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`[BetterTTV] Set | ${res.status}: ${error.message || res.statusText}`);
	}

	const data: BTTVUser = await res.json();
	if (!data) {
		throw new Error(`[BetterTTV] Set | 404: ${$format('status.404')}`);
	}

	const allEmotes = [
		...(Array.isArray(data.channelEmotes) ? data.channelEmotes : []),
		...(Array.isArray(data.sharedEmotes) ? data.sharedEmotes : [])
	];

	const userName =
		data.name && data.displayName ? compareName(data.name, data.displayName) : 'BetterTTV';

	return {
		id: data.id,
		name: $format('set.title', { values: { user: userName } }),
		subtitle: null,
		tags: [],
		source: `https://betterttv.net/users/${data.id}`,
		provider: 'bttv',
		owner: {
			id: data.providerId,
			username: userName,
			avatar: `https://cdn.frankerfacez.com/avatar/twitch/${data.providerId}`,
			source: `https://betterttv.net/users/${data.id}`,
			platform: 'twitch'
		},
		emotes: allEmotes.map((emote) => ({
			id: emote.id,
			name: emote.code,
			owner: emote.user ? compareName(emote.user.name, emote.user.displayName) : null,
			image: `https://cdn.betterttv.net/emote/${emote.id}/3x.webp`,
			zeroWidth: zeroWidthEmotes.includes(emote.id),
			provider: 'bttv'
		}))
	};
}
