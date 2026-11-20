import type { PageRequest, SearchPage } from './pages';
import type {
	EmoteSearchOptions,
	EmoteSearchResult,
	SearchEmote,
	SearchProvider
} from '#lib/emotes/search.ts';

import { getTopEmotes, type TopEmotes } from '#lib/server/providers/lurkology.ts';
import { searchTwitchEmotes } from '#lib/server/providers/twitch.ts';
import { ProviderError, RequestError } from '#lib/server/http.ts';
import { emoteIdCandidates } from '#lib/emotes/getEmoteByLink.ts';
import { searchBTTVEmotes } from '#lib/server/providers/bttv.ts';
import { search7TVEmotes } from '#lib/server/providers/7tv.ts';
import { searchFFZEmotes } from '#lib/server/providers/ffz.ts';
import { calculateSimilarity } from '#lib/utils/index.ts';
import { cached, profiles } from '#lib/server/cache.ts';
import { log } from '#lib/server/logger.ts';
import { fetchEmote } from './fetchEmote';
import {
	defaultEmoteSearch,
	searchProviders,
	supportsSearch,
	sortField,
	MAX_LIMIT,
	MAX_QUERY_LENGTH,
	PAGE_SIZE
} from '#lib/emotes/search.ts';

type Searcher = (options: EmoteSearchOptions, page: PageRequest) => Promise<SearchPage>;

const searchers: Record<SearchProvider, Searcher> = {
	'7tv': search7TVEmotes,
	bttv: searchBTTVEmotes,
	ffz: searchFFZEmotes,
	twitch: searchTwitchEmotes
};

type Cursor = Partial<Record<SearchProvider, string>>;

const PROVIDER_BUDGET = 8000;
const POSITION_WEIGHT = 0.6;
const SIMILARITY_WEIGHT = 0.4;

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function normalize(options: Partial<EmoteSearchOptions>): EmoteSearchOptions {
	const merged = { ...defaultEmoteSearch, ...options };
	const providers = searchProviders.filter((name) => merged.providers.includes(name));
	const limit = Math.trunc(merged.limit);

	return {
		...merged,
		query: merged.query.trim().slice(0, MAX_QUERY_LENGTH),
		providers: providers.length ? providers : [...searchProviders],
		limit: limit > 0 ? Math.min(limit, MAX_LIMIT) : defaultEmoteSearch.limit
	};
}

const encodeCursor = (cursor: Cursor): string | null =>
	Object.keys(cursor).length ? Buffer.from(JSON.stringify(cursor)).toString('base64url') : null;

function decodeCursor(value: string): Cursor {
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

		if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
			return Object.fromEntries(
				Object.entries(parsed).filter(
					([name, next]) =>
						searchProviders.includes(name as SearchProvider) && typeof next === 'string'
				)
			) as Cursor;
		}
	} catch {
		// ignore
	}

	throw new RequestError(400, 'status.400');
}

function cacheKey(provider: SearchProvider, options: EmoteSearchOptions, page: PageRequest) {
	const query = options.exact ? options.query : options.query.toLowerCase();
	const flags = [options.zeroWidth, options.personal, options.exact].map(Number).join('');
	const position = `${page.count}@${page.cursor ?? ''}`;

	return `emote-search:${provider}:${options.format}:${flags}:${options.sort}:${position}:${query}`;
}

function accepts(emote: SearchEmote, options: EmoteSearchOptions): boolean {
	const field = sortField(options.sort);
	const query = options.query.toLowerCase();

	if (options.format !== 'all' && emote.animated !== (options.format === 'animated')) {
		return false;
	}
	if (options.zeroWidth && !emote.zero_width) return false;
	if (options.exact && query && emote.name.toLowerCase() !== query) return false;
	if (field === 'owner' && !emote.owner) return false;
	if (field === 'date' && !emote.createdAt) return false;

	return true;
}

const keyOf = (emote: SearchEmote): string => `${emote.provider}:${emote.id}`;

function combine(emotes: SearchEmote[]): SearchEmote[] {
	const byKey = new Map<string, SearchEmote>();

	for (const emote of emotes) {
		const known = byKey.get(keyOf(emote));

		if (!known) {
			byKey.set(keyOf(emote), { ...emote });
			continue;
		}

		for (const [field, value] of Object.entries(emote)) {
			if (value !== null && value !== undefined) {
				(known as unknown as Record<string, unknown>)[field] = value;
			}
		}
	}

	return [...byKey.values()];
}

function score(term: string, emote: SearchEmote, position: number, size: number): number {
	const name = emote.name.toLowerCase();

	if (name === term) return 1 + 1 / (position + 1);

	const relevance = Math.max(0, 1 - position / size);
	return POSITION_WEIGHT * relevance + SIMILARITY_WEIGHT * calculateSimilarity(term, name);
}

function interleave(lists: SearchEmote[][]): SearchEmote[] {
	const longest = Math.max(0, ...lists.map((list) => list.length));

	return Array.from({ length: longest }, (_, i) => lists.flatMap((list) => list[i] ?? [])).flat();
}

function compare(options: EmoteSearchOptions): (a: SearchEmote, b: SearchEmote) => number {
	const field = sortField(options.sort);
	const direction = options.sort.endsWith('-desc') ? -1 : 1;

	const byName = (a: SearchEmote, b: SearchEmote) => collator.compare(a.name, b.name);

	return (a, b) => {
		if (field === 'owner') {
			return direction * collator.compare(a.owner ?? '', b.owner ?? '') || byName(a, b);
		}
		if (field === 'date') {
			return direction * (Date.parse(a.createdAt ?? '') - Date.parse(b.createdAt ?? ''));
		}

		return direction * byName(a, b);
	};
}

function arrange(lists: SearchEmote[][], options: EmoteSearchOptions): SearchEmote[] {
	if (options.sort !== 'relevance') {
		return lists.flat().sort(compare(options));
	}

	if (!options.query) return interleave(lists);

	const term = options.query.toLowerCase();
	const size = Math.max(1, ...lists.map((list) => list.length));

	return lists
		.flatMap((list) =>
			list.map((emote, position) => ({ emote, score: score(term, emote, position, size) }))
		)
		.sort((a, b) => b.score - a.score)
		.map(({ emote }) => emote);
}

function withinBudget<T>(provider: string, task: Promise<T>): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const deadline = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new ProviderError(`[Search] ${provider} is still loading`, 504)),
			PROVIDER_BUDGET
		);
	});

	task.catch(() => {});
	return Promise.race([task, deadline]).finally(() => clearTimeout(timer));
}

function topEmotes(): Promise<TopEmotes | null> {
	return cached('emote-trending:lurkology', profiles.trending, getTopEmotes).catch((err) => {
		log.warn('Search', 'Lurkology is unavailable, showing provider trends only', err);
		return null;
	});
}

async function emotesById(options: EmoteSearchOptions): Promise<SearchEmote[]> {
	const candidates = emoteIdCandidates(options.query).filter(({ provider }) =>
		options.providers.includes(provider as SearchProvider)
	);

	const found = await Promise.allSettled(
		candidates.map((ref) => withinBudget(ref.provider, fetchEmote(ref)))
	);

	return found.flatMap((result) => {
		if (result.status !== 'fulfilled') return [];
		const emote = result.value;

		return [
			{
				id: emote.id,
				name: emote.name,
				image: emote.images.at(-1) ?? '',
				owner: emote.owner?.username ?? null,
				zero_width: emote.zero_width,
				animated: emote.animated,
				createdAt: emote.createdAt ? new Date(emote.createdAt).toISOString() : null,
				provider: emote.provider
			}
		];
	});
}

export async function searchEmotes(
	search: Partial<EmoteSearchOptions> = {},
	after: string | null = null
): Promise<EmoteSearchResult> {
	const options = normalize(search);
	const trending = !options.query;
	const firstPage = after === null;

	const supported = options.providers.filter((name) => supportsSearch(name, options));
	const skipped = options.providers.filter((name) => !supported.includes(name));

	const cursor: Cursor = firstPage
		? Object.fromEntries(supported.map((name) => [name, '']))
		: decodeCursor(after);
	const providers = supported.filter((name) => cursor[name] !== undefined);

	const count = firstPage ? options.limit : Math.ceil(PAGE_SIZE / Math.max(1, providers.length));

	const [top, byId, results] = await Promise.all([
		firstPage && trending && !options.personal ? topEmotes() : null,
		firstPage && !trending ? emotesById(options) : [],
		Promise.allSettled(
			providers.map((name) => {
				const page: PageRequest = { cursor: cursor[name] || null, count };
				const profile = trending ? profiles.trending : profiles.list;

				return withinBudget(
					name,
					cached(cacheKey(name, options, page), profile, () =>
						searchers[name](options, page)
					)
				);
			})
		)
	]);

	const failed: SearchProvider[] = [];
	const next: Cursor = {};

	const lists = results.map((result, i) => {
		const name = providers[i];

		if (result.status === 'rejected') {
			const slow = result.reason instanceof ProviderError && result.reason.status === 504;

			if (slow) log.warn('Search', `${name} emotes took too long, they will be ready later`);
			else log.error('Search', `${name} emotes are unavailable`, result.reason);

			failed.push(name);
			next[name] = cursor[name];
		} else if (result.value.next) {
			next[name] = result.value.next;
		}

		const found = result.status === 'fulfilled' ? result.value.emotes : [];
		const extra = top
			? [...top.trending.filter((emote) => emote.provider === name), ...top.byProvider[name]]
			: [];

		return combine([...extra, ...found]).filter((emote) => accepts(emote, options));
	});

	const listed = arrange(lists, options);
	const ids = new Set(byId.map(keyOf));

	return {
		emotes: [...byId, ...listed.filter((emote) => !ids.has(keyOf(emote)))],
		failed: failed.filter((name) => !lists[providers.indexOf(name)].length),
		skipped,
		next: encodeCursor(next)
	};
}
