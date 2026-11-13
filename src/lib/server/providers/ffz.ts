import type {
	Channel,
	ChannelProvider,
	Channels,
	Emote,
	Emotes,
	Platforms,
	Set
} from '#lib/types/common.ts';
import type {
	Emote as FFZEmoticon,
	FFZEmote,
	FFZGlobals,
	FFZSet,
	FFZUser
} from '#lib/types/ffz.ts';
import type { EmoteContext } from './context';

import { ProviderError, request, requestJson, requestOk } from '#lib/server/http.ts';
import { compareName, decodeHtml } from '#lib/utils/index.ts';

const API = 'https://api.frankerfacez.com';

const emoteImage = (emote: Pick<FFZEmoticon, 'id' | 'animated'>, scale = 4): string =>
	`https://cdn.frankerfacez.com/emoticon/${emote.id}${emote.animated ? '/animated' : ''}/${scale}`;

function transformEmotes(emotes: FFZEmoticon[]): Emotes[] {
	return emotes.map((emote) => ({
		id: emote.id.toString(),
		name: emote.name,
		image: emoteImage(emote),
		owner: compareName(emote.owner.name, emote.owner.display_name),
		provider: 'ffz'
	}));
}

const setName = (title: string): string | null => (title.startsWith('Channel:') ? null : title);

export async function getFFZEmote(emoteId: string, ctx: EmoteContext): Promise<Emote> {
	const source = '[FrankerFaceZ] Emote';
	const data = (
		await requestJson<FFZEmote>(source, `${API}/v2/emote/${encodeURIComponent(emoteId)}`)
	).emote;

	if (!data) {
		throw new ProviderError(source, 404);
	}

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
			avatar: `https://cdn.frankerfacez.com/avatar/${data.owner.provider}/${data.owner.provider_id}`,
			source: `https://frankerfacez.com/channel/${data.owner.name}`,
			username: compareName(data.owner.name, data.owner.display_name),
			platform: data.owner.provider as Platforms
		},
		images: [1, 2, 4].map((scale) => emoteImage(data, scale)),
		source: `https://frankerfacez.com/emoticon/${emoteId}`,
		createdAt: data.created_at,
		approved: data.status === 1,
		type: ctx.global ? 'GLOBALS' : 'CHANNEL',
		public: data.public,
		animated: data.animated,
		global: !!ctx.global,
		deleted: false,
		channels: { total: data.use_count, list: [] }
	};
}

const channelPattern =
	/<img class="table-avatar" src="([^"]+)"><\/td>\s*<td><a href="\/channel\/([^"]+)">([^<]*)<\/a>/g;

export async function getFFZChannels(emoteId: string, page: number = 1): Promise<Channels> {
	const source = '[FrankerFaceZ] Channels';
	const res = await requestOk(
		source,
		`https://frankerfacez.com/emoticon/${encodeURIComponent(emoteId)}?c_page=${page}`,
		{ timeout: 30000 }
	);

	const html = await res.text();
	const total = parseInt((html.match(/Used in ([\d,]+) set/)?.[1] || '0').replace(/,/g, ''));

	if (!html.includes('emote-table')) {
		if (page === 1 && total > 0) {
			return {
				total: 1,
				list: [
					{
						id: '46622312',
						avatar: 'https://api.spanix.team/avatar/id/46622312/150',
						username: 'FrankerFaceZ',
						platform: 'twitch'
					}
				]
			};
		}

		return { total: 0, list: [] };
	}

	const list: Channel[] = [];
	for (const [, avatar, login, displayName] of html.matchAll(channelPattern)) {
		list.push({
			id: avatar.split('/').pop() ?? '',
			avatar,
			username: compareName(login, decodeHtml(displayName)),
			platform: 'twitch'
		});
	}

	return { total, list };
}

export async function getFFZGlobalEmotes(): Promise<Emotes[]> {
	const source = '[FrankerFaceZ] Global Emotes';
	const body = await requestJson<FFZGlobals>(source, `${API}/v1/set/global`);

	if (!body?.default_sets || !body.sets) {
		throw new ProviderError(source, 500);
	}

	return transformEmotes(body.default_sets.flatMap((id) => body.sets[id]?.emoticons ?? []));
}

export async function getFFZEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' = 'twitch'
): Promise<ChannelProvider> {
	const source = '[FrankerFaceZ] User';
	const platforms = { twitch: 'id', youtube: 'yt' };

	const data = await requestJson<FFZUser>(
		source,
		`${API}/v1/room/${platforms[platform] ?? platform}/${encodeURIComponent(userId)}`
	);

	if (!data?.room) {
		throw new ProviderError(source, 404);
	}

	const channelUrl = `https://frankerfacez.com/channel/${data.room.id}`;

	return {
		provider: 'ffz',
		bots: data.room.user_badges?.['2'] || [],
		sets: Object.values(data.sets).map((set) => ({
			id: set.id.toString(),
			name: setName(set.title),
			subtitle: null,
			tags: [],
			source: channelUrl,
			provider: 'ffz',
			owner: {
				id: userId.toString(),
				username: compareName(data.room.id, data.room.display_name),
				avatar: `https://cdn.frankerfacez.com/avatar/${platform}/${userId}`,
				source: channelUrl,
				platform
			},
			mainSet: set.id === data.room.set,
			emotes: transformEmotes(set.emoticons)
		}))
	};
}

export async function getFFZSet(setId: string): Promise<Set> {
	const source = '[FrankerFaceZ] Set';
	const url = `${API}/v2/collection/${encodeURIComponent(setId)}?per_page=200`;

	const data = await requestJson<FFZSet>(source, url);

	if (!data?.collection || !data.emotes) {
		throw new ProviderError(source, 404);
	}

	const pages = await Promise.all(
		Array.from({ length: Math.max(0, data.pages - 1) }, async (_, i) => {
			try {
				const res = await request(`${url}&page=${i + 2}`);
				return res.ok ? ((await res.json()) as FFZSet).emotes : [];
			} catch {
				return [];
			}
		})
	);

	const set = data.collection;

	return {
		id: setId.toString(),
		name: setName(set.title),
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
		emotes: transformEmotes([...data.emotes, ...pages.flat()])
	};
}
