import type { SearchEmote, SearchProvider } from '#lib/emotes/search.ts';
import type { User } from '#lib/types/common.ts';

import { ProviderError, requestJson } from '#lib/server/http.ts';
import { searchProviders } from '#lib/emotes/search.ts';
import { compareName } from '#lib/utils/index.ts';

interface LurkologyEmote {
	provider: string;
	id: string;
	name: string;
	url: string;
	uses: number;
}

interface LurkologyTop {
	byProvider?: Partial<Record<string, LurkologyEmote[]>>;
	trending?: LurkologyEmote[];
}

export interface TopEmotes {
	trending: SearchEmote[];
	byProvider: Record<SearchProvider, SearchEmote[]>;
}

const images: Record<SearchProvider, (id: string) => string> = {
	'7tv': (id) => `https://cdn.7tv.app/emote/${id}/4x.avif`,
	bttv: (id) => `https://cdn.betterttv.net/emote/${id}/3x.webp`,
	ffz: (id) => `https://cdn.frankerfacez.com/emote/${id}/4`,
	twitch: (id) => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`
};

const isProvider = (name: string): name is SearchProvider =>
	searchProviders.includes(name as SearchProvider);

function transform(list: LurkologyEmote[] | undefined): SearchEmote[] {
	return (list ?? [])
		.filter((emote) => isProvider(emote.provider) && emote.id && emote.name)
		.map((emote) => ({
			id: emote.id,
			name: emote.name,
			image: images[emote.provider as SearchProvider](emote.id),
			owner: null,
			provider: emote.provider
		}));
}

export async function getTopEmotes(): Promise<TopEmotes> {
	const source = '[Lurkology] Top Emotes';
	const data = await requestJson<LurkologyTop>(
		source,
		'https://api.lurkology.com/v1/emotes/top?period=7d'
	);

	if (!data?.byProvider && !data?.trending) {
		throw new ProviderError(source, 502);
	}

	return {
		trending: transform(data.trending),
		byProvider: Object.fromEntries(
			searchProviders.map((provider) => [provider, transform(data.byProvider?.[provider])])
		) as Record<SearchProvider, SearchEmote[]>
	};
}

interface LurkologyChannel {
	platform: string;
	id: string;
	login: string;
	displayName: string;
	avatarUrl: string | null;
}

const channelUrls: Record<string, (login: string) => string> = {
	twitch: (login) => `https://twitch.tv/${login}`,
	kick: (login) => `https://kick.com/${login}`
};

function toUser(channel: LurkologyChannel, extra: Partial<User> = {}): User | null {
	const url = channelUrls[channel.platform];
	if (!url || !channel.login) return null;

	return {
		id: channel.id,
		username: compareName(channel.login, channel.displayName),
		avatar: channel.avatarUrl ?? undefined,
		platform: channel.platform as User['platform'],
		source: url(channel.login),
		...extra
	};
}

const LIVE_PAGE_LIMIT = 100;

export interface LivePage {
	channels: User[];
	next: number | null;
}

export async function getLiveChannels(
	platform: 'twitch' | 'kick',
	limit: number,
	offset = 0
): Promise<LivePage> {
	const source = '[Lurkology] Live Channels';
	const url = new URL('https://api.lurkology.com/v1/live');
	url.search = new URLSearchParams({
		platform,
		limit: String(Math.min(limit, LIVE_PAGE_LIMIT)),
		offset: String(offset)
	}).toString();

	const data = await requestJson<{
		streams?: { channel: LurkologyChannel; viewers: number }[];
		nextOffset?: number | null;
	}>(source, url);
	if (!Array.isArray(data?.streams)) throw new ProviderError(source, 502);

	return {
		channels: data.streams.flatMap(({ channel, viewers }) => {
			const user = toUser(channel, { viewers });
			return user ? [user] : [];
		}),
		next: data.streams.length && data.nextOffset ? data.nextOffset : null
	};
}

export async function getTopChannels(limit: number): Promise<User[]> {
	const source = '[Lurkology] Top Channels';
	const url = new URL('https://api.lurkology.com/v1/rankings/channels');
	url.search = new URLSearchParams({
		period: '7d',
		metric: 'hoursWatched',
		limit: String(limit)
	}).toString();

	const data = await requestJson<{ rows?: { channel: LurkologyChannel; avgViewers?: number }[] }>(
		source,
		url
	);
	if (!Array.isArray(data?.rows)) throw new ProviderError(source, 502);

	return data.rows.flatMap(({ channel, avgViewers }) => {
		const user = toUser(channel, { viewers: avgViewers ? Math.round(avgViewers) : null });
		return user ? [user] : [];
	});
}
