import type { User } from '#lib/types/common.ts';

export const channelPlatforms = ['twitch', 'kick', 'youtube'] as const;
export const channelSorts = [
	'relevance',
	'name-asc',
	'name-desc',
	'followers-desc',
	'followers-asc'
] as const;

export type ChannelPlatform = (typeof channelPlatforms)[number];
export type ChannelSort = (typeof channelSorts)[number];

export interface ChannelSearchOptions {
	query: string;
	platforms: ChannelPlatform[];
	sort: ChannelSort;
}

export interface ChannelSearchResult {
	channels: User[];
	failed: ChannelPlatform[];
	next: string | null;
}

export const CHANNEL_PAGE_SIZE = 90;

export const MAX_CHANNEL_QUERY = 200;

export const defaultChannelSearch: ChannelSearchOptions = {
	query: '',
	platforms: [...channelPlatforms],
	sort: 'relevance'
};

export function parseChannelSearch(params: URLSearchParams): ChannelSearchOptions {
	const platforms = (params.get('platforms') ?? '')
		.split(',')
		.filter((name): name is ChannelPlatform =>
			channelPlatforms.includes(name as ChannelPlatform)
		);
	const sort = params.get('sort') as ChannelSort;

	return {
		query: (params.get('q') ?? '').trim().slice(0, MAX_CHANNEL_QUERY),
		platforms: platforms.length
			? channelPlatforms.filter((name) => platforms.includes(name))
			: [...channelPlatforms],
		sort: channelSorts.includes(sort) ? sort : defaultChannelSearch.sort
	};
}

export function channelSearchParams(options: ChannelSearchOptions): URLSearchParams {
	const params = new URLSearchParams();
	const query = options.query.trim();
	const all = channelPlatforms.every((name) => options.platforms.includes(name));

	if (query) params.set('q', query);
	if (!all) {
		params.set(
			'platforms',
			channelPlatforms.filter((p) => options.platforms.includes(p)).join(',')
		);
	}
	if (options.sort !== 'relevance') params.set('sort', options.sort);

	return params;
}
