import type { Emotes } from '#lib/types/common.ts';

export const searchProviders = ['7tv', 'bttv', 'ffz', 'twitch'] as const;
export const emoteFormats = ['all', 'animated', 'static'] as const;
export const emoteSorts = [
	'relevance',
	'name-asc',
	'name-desc',
	'owner-asc',
	'owner-desc',
	'date-desc',
	'date-asc'
] as const;

export type SearchProvider = (typeof searchProviders)[number];
export type EmoteFormat = (typeof emoteFormats)[number];
export type EmoteSort = (typeof emoteSorts)[number];

export interface EmoteSearchOptions {
	query: string;
	providers: SearchProvider[];
	format: EmoteFormat;
	zeroWidth: boolean;
	personal: boolean;
	exact: boolean;
	sort: EmoteSort;
	limit: number;
}

export interface SearchEmote extends Emotes {
	animated?: boolean;
	createdAt?: string | null;
}

export interface EmoteSearchResult {
	emotes: SearchEmote[];
	failed: SearchProvider[];
	skipped: SearchProvider[];
	next: string | null;
}

export const MAX_QUERY_LENGTH = 100;
export const MAX_LIMIT = 50;
export const PAGE_SIZE = 90;

export const defaultEmoteSearch: EmoteSearchOptions = {
	query: '',
	providers: [...searchProviders],
	format: 'all',
	zeroWidth: false,
	personal: false,
	exact: false,
	sort: 'relevance',
	limit: 25
};

interface Capabilities {
	zeroWidth: boolean;
	personal: boolean;
	owner: boolean;
	date: boolean;
	minQuery: number;
}

const capabilities: Record<SearchProvider, Capabilities> = {
	'7tv': { zeroWidth: true, personal: true, owner: true, date: true, minQuery: 1 },
	bttv: { zeroWidth: true, personal: true, owner: true, date: true, minQuery: 3 },
	ffz: { zeroWidth: true, personal: false, owner: true, date: true, minQuery: 1 },
	twitch: { zeroWidth: false, personal: false, owner: false, date: false, minQuery: 1 }
};

export const sortField = (sort: EmoteSort): 'name' | 'owner' | 'date' | null =>
	sort === 'relevance' ? null : (sort.split('-')[0] as 'name' | 'owner' | 'date');

export function supportsSearch(provider: SearchProvider, options: EmoteSearchOptions): boolean {
	const caps = capabilities[provider];
	const field = sortField(options.sort);
	const query = options.query.trim();

	return (
		(!options.zeroWidth || caps.zeroWidth) &&
		(!options.personal || caps.personal) &&
		(field !== 'owner' || caps.owner) &&
		(field !== 'date' || caps.date) &&
		(!query || query.length >= caps.minQuery)
	);
}

const pick = <T extends string>(list: readonly T[], value: string | null, fallback: T): T =>
	list.includes(value as T) ? (value as T) : fallback;

const flag = (value: string | null): boolean => value === '1' || value === 'true';

export function parseEmoteSearch(params: URLSearchParams): EmoteSearchOptions {
	const providers = (params.get('providers') ?? '')
		.split(',')
		.filter((name): name is SearchProvider => searchProviders.includes(name as SearchProvider));

	const limit = Number(params.get('limit'));

	return {
		query: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
		providers: providers.length ? [...new Set(providers)] : [...searchProviders],
		format: pick(emoteFormats, params.get('format'), defaultEmoteSearch.format),
		zeroWidth: flag(params.get('zero_width')),
		personal: flag(params.get('personal')),
		exact: flag(params.get('exact')),
		sort: pick(emoteSorts, params.get('sort'), defaultEmoteSearch.sort),
		limit:
			Number.isInteger(limit) && limit > 0
				? Math.min(limit, MAX_LIMIT)
				: defaultEmoteSearch.limit
	};
}

export function emoteSearchParams(options: EmoteSearchOptions): URLSearchParams {
	const params = new URLSearchParams();
	const query = options.query.trim();
	const allProviders = searchProviders.every((name) => options.providers.includes(name));

	if (query) params.set('q', query);
	if (!allProviders) {
		params.set(
			'providers',
			searchProviders.filter((p) => options.providers.includes(p)).join(',')
		);
	}
	if (options.format !== 'all') params.set('format', options.format);
	if (options.zeroWidth) params.set('zero_width', '1');
	if (options.personal) params.set('personal', '1');
	if (options.exact) params.set('exact', '1');
	if (options.sort !== 'relevance') params.set('sort', options.sort);
	if (options.limit !== defaultEmoteSearch.limit) params.set('limit', String(options.limit));

	return params;
}
