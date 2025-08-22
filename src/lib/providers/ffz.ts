import type {
	Channel,
	ChannelProvider,
	Channels,
	Emote,
	Emotes,
	Platforms,
	Set
} from '$lib/types/common';
import type { FFZEmote, FFZGlobals, FFZSet, FFZUser } from '$lib/types/ffz';

import { $format, compareName, findGlobalEmote, proxyUrl } from '$lib/utils';

export async function getFFZEmote(emoteId: string): Promise<Emote> {
	const url = `https://api.frankerfacez.com/v2/emote/${encodeURIComponent(emoteId)}`;

	const res = await fetch(url);
	const body: FFZEmote = await res.json();

	if (!res.ok) {
		const message = res.status === 404 ? $format('status.404') : body.message || res.statusText;
		throw new Error(`[FrankerFaceZ] Emote | ${res.status}: ${message}`);
	}

	const data = body.emote;
	if (!data) {
		throw new Error(`[FrankerFaceZ] Emote | 404: ${$format('status.404')}`);
	}

	const userName = compareName(data.owner.name, data.owner.display_name);

	const isAnimated = data.animated ? '/animated' : '';

	const isGlobal = await findGlobalEmote(emoteId, 'ffz');

	return {
		id: emoteId.toString(),
		name: data.name,
		provider: 'ffz',
		tags: [],
		artist:
			data.artist && data.artist.name !== data.owner.name
				? {
						id: data.artist.provider_id,
						avatar: `https://cdn.frankerfacez.com/avatar/${data.artist.provider}/${data.artist.provider_id}`,
						source: `https://frankerfacez.com/channel/${data.artist.name}`,
						username: compareName(data.artist.name, data.artist.display_name),
						platform: data.artist.provider as Platforms
					}
				: null,
		owner: {
			id: data.owner.provider_id,
			avatar: `https://cdn.frankerfacez.com/avatar/twitch/${data.owner.provider_id}`,
			source: `https://frankerfacez.com/channel/${data.owner.name}`,
			username: userName,
			platform: data.owner.provider as Platforms
		},

		images: [
			`https://cdn.frankerfacez.com/emoticon/${emoteId}${isAnimated}/1`,
			`https://cdn.frankerfacez.com/emoticon/${emoteId}${isAnimated}/2`,
			`https://cdn.frankerfacez.com/emoticon/${emoteId}${isAnimated}/4`
		],
		source: `https://frankerfacez.com/emoticon/${emoteId}`,
		createdAt: data.created_at,
		approved: data.status === 1,
		type: isGlobal ? 'GLOBALS' : 'CHANNEL',
		public: data.public,
		animated: data.animated,
		global: !!isGlobal,
		deleted: false,
		channels: { total: data.use_count, list: [] }
	};
}

export async function getFFZChannels(emoteId: string, page: number = 1): Promise<Channels> {
	const url = `${proxyUrl}https://frankerfacez.com/emoticon/${emoteId}?c_page=${page}`;

	const res = await fetch(url);
	if (!res.ok) throw new Error(`[FrankerFaceZ] Channels | ${res.status}: Failed to Fetch`);

	const html = await res.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	const totalText = doc.body.textContent?.match(/Used in ([\d,]+) set/)?.[1] || '0';
	const total = parseInt(totalText.replace(/,/g, ''));

	const tbody = doc.querySelector('table.emote-table > tbody');
	if (!tbody) {
		if (page === 1 && total > 0) {
			return {
				total: 1,
				list: [
					{
						id: '46622312',
						avatar: 'https://cdn.frankerfacez.com/avatar/twitch/46622312',
						username: 'FrankerFaceZ',
						platform: 'twitch'
					}
				]
			};
		} else {
			return { total: 0, list: [] };
		}
	}

	const rows = Array.from(tbody.querySelectorAll('tr'));
	const list: Channel[] = [];

	for (const tr of rows) {
		const tds = tr.querySelectorAll('td');

		const img1 = tds[1]?.querySelector('img')?.getAttribute('src');
		const a1 = tds[2]?.querySelector('a');
		if (img1 && a1) {
			const id = img1.split('/').pop()!;
			const avatar = img1;
			const displayName = a1.textContent || '';
			const login = a1.getAttribute('href')?.split('/').pop() || '';
			const username = compareName(login, displayName);
			list.push({ id, avatar, username, platform: 'twitch' });
		}

		const img2 = tds[4]?.querySelector('img')?.getAttribute('src');
		const a2 = tds[5]?.querySelector('a');
		if (img2 && a2) {
			const id = img2.split('/').pop()!;
			const avatar = img2;
			const displayName = a2.textContent || '';
			const login = a2.getAttribute('href')?.split('/').pop() || '';
			const username = compareName(login, displayName);
			list.push({ id, avatar, username, platform: 'twitch' });
		}
	}

	return { total, list };
}

export async function getFFZGlobalEmotes(): Promise<Emotes[]> {
	const url = 'https://api.frankerfacez.com/v1/set/global';

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`[FrankerFaceZ] Global Emotes ${res.status}: ${res.statusText}`);
	}

	const body: FFZGlobals = await res.json();

	const emotes = body.default_sets.flatMap((id: number) => body.sets[id]?.emoticons ?? []);

	return emotes.map((emote) => ({
		id: emote.id.toString(),
		name: emote.name,
		image: `https://cdn.frankerfacez.com/emoticon/${emote.id}/4`,
		owner: compareName(emote.owner.name, emote.owner.display_name),
		provider: 'ffz'
	}));
}

export async function getFFZEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' = 'twitch'
): Promise<ChannelProvider> {
	const platforms = {
		twitch: 'id',
		youtube: 'yt'
	};
	const url = `https://api.frankerfacez.com/v1/room/${platforms[platform] ?? platform}/${encodeURIComponent(userId)}`;

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`[FrankerFaceZ] User | ${res.status}: ${error.message || res.statusText}`);
	}

	const data: FFZUser = await res.json();
	if (!data || !data.room) {
		throw new Error(`[FrankerFaceZ] User | ${$format('status.404')}`);
	}

	const userName = compareName(data.room.id, data.room.display_name);

	return {
		provider: 'ffz',
		bots: data.room.user_badges?.['2'] || [],
		sets: Object.values(data.sets).map((set) => ({
			id: set.id.toString(),
			name: null,
			subtitle: null,
			tags: [],
			source: `https://frankerfacez.com/channel/${data.room.id}`,
			provider: 'ffz',
			owner: {
				id: userId.toString(),
				username: userName,
				avatar: `https://cdn.frankerfacez.com/avatar/${platform}/${userId}`,
				source: `https://frankerfacez.com/channel/${data.room.id}`,
				platform
			},
			mainSet: set.id === data.room.set,
			emotes: set.emoticons.map((emote) => ({
				id: emote.id.toString(),
				name: emote.name,
				image: `https://cdn.frankerfacez.com/emoticon/${emote.id}${emote.animated ? '/animated' : ''}/4`,
				owner: compareName(emote.owner.name, emote.owner.display_name),
				provider: 'ffz'
			}))
		}))
	};
}

export async function getFFZSet(setId: string): Promise<Set> {
	const url = `https://api.frankerfacez.com/v2/collection/${setId}?per_page=200`;

	const res = await fetch(url);
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(`[FrankerFaceZ] Set | ${res.status}: ${error.message || res.statusText}`);
	}

	const data: FFZSet = await res.json();

	if (!data || !data.collection || !data.emotes) {
		throw new Error(`[FrankerFaceZ] Set | 404: ${$format('status.404')}`);
	}

	const set = data.collection;
	let emotes = data.emotes;
	let pages = 1;

	while (data.pages > pages) {
		const newUrl = url + `&page=${++pages}`;
		const newRes = await fetch(newUrl);
		if (newRes.ok) {
			const newData: FFZSet = await newRes.json();
			emotes = [...emotes, ...newData.emotes];
		}
	}

	return {
		id: setId.toString(),
		name: set.title,
		subtitle: null,
		tags: [],
		source: `https://frankerfacez.com/channel/${set.owner.name}`,
		provider: 'ffz',
		owner: {
			id: set.owner.provider_id,
			username: compareName(set.owner.name, set.owner.display_name),
			avatar: `https://cdn.frankerfacez.com/avatar/${set.owner.provider}/${set.owner.provider_id}`,
			source: `https://frankerfacez.com/channel/${set.owner.name}`,
			platform: 'twitch'
		},
		emotes: emotes.map((emote) => ({
			id: emote.id.toString(),
			name: emote.name,
			image: `https://cdn.frankerfacez.com/emoticon/${emote.id}${emote.animated ? '/animated' : ''}/4`,
			owner: compareName(emote.owner.name, emote.owner.display_name),
			provider: 'ffz'
		}))
	};
}
