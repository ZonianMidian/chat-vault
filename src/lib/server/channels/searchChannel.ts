import type { YouTubeLiveCursor } from '#lib/server/providers/youtube.ts';
import type { User } from '#lib/types/common.ts';
import type {
	ChannelSearchOptions,
	ChannelSearchResult,
	ChannelPlatform
} from '#lib/channels/search.ts';

import { getYouTubeLiveChannels, searchYouTubeChannel } from '#lib/server/providers/youtube.ts';
import { getLiveChannels, getTopChannels } from '#lib/server/providers/lurkology.ts';
import { CHANNEL_PAGE_SIZE, defaultChannelSearch } from '#lib/channels/search.ts';
import { searchTwitchChannel } from '#lib/server/providers/twitch.ts';
import { searchKickChannel } from '#lib/server/providers/kick.ts';
import { calculateSimilarity } from '#lib/utils/index.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { RequestError } from '#lib/server/http.ts';
import { log } from '#lib/server/logger.ts';

const searchers: Record<ChannelPlatform, (search: string) => Promise<User[]>> = {
	twitch: searchTwitchChannel,
	kick: searchKickChannel,
	youtube: searchYouTubeChannel
};

interface TrendingCursor {
	twitch?: number;
	kick?: number;
	youtube?: YouTubeLiveCursor;
}

interface TrendingPage {
	channels: User[];
	next: TrendingCursor[ChannelPlatform] | null;
}

const FIRST_PAGE = 50;
const TOP_LIMIT = 50;

const POSITION_WEIGHT = 0.6;
const SIMILARITY_WEIGHT = 0.4;
const POSITION_SPAN = 20;

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function score(term: string, channel: User, position: number): number {
	const name = (channel.username ?? '').toLowerCase();

	if (name === term) return 1 + 1 / (position + 1);

	const relevance = Math.max(0, 1 - position / POSITION_SPAN);

	return POSITION_WEIGHT * relevance + SIMILARITY_WEIGHT * calculateSimilarity(term, name);
}

function sortChannels(channels: User[], sort: ChannelSearchOptions['sort']): User[] {
	if (sort === 'relevance') return channels;

	const direction = sort.endsWith('-desc') ? -1 : 1;
	const byName = (a: User, b: User) => collator.compare(a.username ?? '', b.username ?? '');

	return [...channels].sort((a, b) => {
		if (sort.startsWith('name')) return direction * byName(a, b);

		const known = Number(b.followers != null) - Number(a.followers != null);
		return known || direction * ((a.followers ?? 0) - (b.followers ?? 0)) || byName(a, b);
	});
}

const keyOf = (channel: User): string => `${channel.platform}:${channel.id ?? channel.username}`;

function unique(channels: User[]): User[] {
	const seen = new Set<string>();

	return channels.filter((channel) => {
		const key = keyOf(channel);
		if (seen.has(key)) return false;

		seen.add(key);
		return true;
	});
}

const byViewers = (a: User, b: User) => (b.viewers ?? 0) - (a.viewers ?? 0);

function interleave(lists: User[][]): User[] {
	const longest = Math.max(0, ...lists.map((list) => list.length));

	return Array.from({ length: longest }, (_, i) => lists.flatMap((list) => list[i] ?? [])).flat();
}

const encodeCursor = (cursor: TrendingCursor): string | null =>
	Object.keys(cursor).length ? Buffer.from(JSON.stringify(cursor)).toString('base64url') : null;

function decodeCursor(value: string): TrendingCursor {
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
		const cursor: TrendingCursor = {};

		if (Number.isInteger(parsed?.twitch)) cursor.twitch = parsed.twitch;
		if (Number.isInteger(parsed?.kick)) cursor.kick = parsed.kick;
		if (
			typeof parsed?.youtube?.token === 'string' &&
			typeof parsed.youtube.visitor === 'string'
		) {
			cursor.youtube = { token: parsed.youtube.token, visitor: parsed.youtube.visitor };
		}

		return cursor;
	} catch {
		throw new RequestError(400, 'status.400');
	}
}

function livePage(
	platform: ChannelPlatform,
	position: TrendingCursor[ChannelPlatform] | null,
	count: number
): Promise<TrendingPage> {
	if (platform === 'youtube') {
		const cursor = (position as YouTubeLiveCursor | null) ?? null;

		return cursor
			? getYouTubeLiveChannels(cursor, count)
			: cached('channel-live:youtube', profiles.live, () => getYouTubeLiveChannels());
	}

	const offset = (position as number | null) ?? 0;

	return cached(`channel-live:${platform}:${offset}:${count}`, profiles.live, async () => {
		const page = await getLiveChannels(platform, count, offset);
		return { channels: page.channels, next: page.next };
	});
}

async function trending(
	options: ChannelSearchOptions,
	after: string | null
): Promise<ChannelSearchResult> {
	const firstPage = after === null;
	const cursor: TrendingCursor = firstPage ? {} : decodeCursor(after);
	const platforms = firstPage
		? options.platforms
		: options.platforms.filter((name) => cursor[name] !== undefined);

	const count = firstPage
		? FIRST_PAGE
		: Math.ceil(CHANNEL_PAGE_SIZE / Math.max(1, platforms.length));

	const [results, top] = await Promise.all([
		Promise.allSettled(platforms.map((name) => livePage(name, cursor[name] ?? null, count))),
		firstPage
			? cached('channel-top:week', profiles.trending, () => getTopChannels(TOP_LIMIT)).catch(
					(err) => {
						log.warn('Search', 'The weekly channel ranking is unavailable', err);
						return [] as User[];
					}
				)
			: []
	]);

	const failed: ChannelPlatform[] = [];
	const next: TrendingCursor = {};

	const lists = results.map((result, i) => {
		const name = platforms[i];

		if (result.status === 'rejected') {
			log.error('Search', `${name} live channels are unavailable`, result.reason);
			failed.push(name);
			const retry = firstPage ? (name === 'youtube' ? undefined : 0) : cursor[name];
			if (retry !== undefined) (next as Record<string, unknown>)[name] = retry;
			return [];
		}

		if (result.value.next != null) (next as Record<string, unknown>)[name] = result.value.next;

		const weekly = top.filter((channel) => channel.platform === name);
		return unique([...result.value.channels, ...weekly]).sort(byViewers);
	});

	const channels = interleave(lists);

	return {
		channels: sortChannels(channels, options.sort),
		failed: failed.filter((name) => !lists[platforms.indexOf(name)].length),
		next: encodeCursor(next)
	};
}

export async function searchChannels(
	search: Partial<ChannelSearchOptions> = {},
	after: string | null = null
): Promise<ChannelSearchResult> {
	const options = { ...defaultChannelSearch, ...search };
	const term = options.query.trim().toLowerCase();

	if (!term) return trending(options, after);

	const results = await Promise.allSettled(
		options.platforms.map((platform) =>
			cached(`channel-search:${platform}:${term}`, profiles.live, () =>
				searchers[platform](term)
			)
		)
	);

	const failed: ChannelPlatform[] = [];
	const ranked = results
		.flatMap((result, i) => {
			if (result.status === 'fulfilled') {
				return result.value.map((channel, position) => ({
					channel,
					score: score(term, channel, position)
				}));
			}

			log.error('Search', `${options.platforms[i]} channels are unavailable`, result.reason);
			failed.push(options.platforms[i]);
			return [];
		})
		.sort((a, b) => b.score - a.score)
		.map(({ channel }) => channel);

	return { channels: sortChannels(ranked, options.sort), failed, next: null };
}
