import type { SearchEmote } from '#lib/emotes/search.ts';

export interface PageRequest {
	cursor: string | null;
	count: number;
}

export interface SearchPage {
	emotes: SearchEmote[];
	next: string | null;
}

interface FetchedPage<T> {
	items: T[];
	more: boolean;
}

export async function fetchRange<T>(
	offset: number,
	count: number,
	fetchPage: (page: number, perPage: number) => Promise<FetchedPage<T>>
): Promise<{ items: T[]; next: number | null }> {
	const page = Math.floor(offset / count) + 1;
	const skip = offset % count;

	const both = skip > 0 && count - skip < count / 2;

	const pages = await Promise.all(
		both ? [fetchPage(page, count), fetchPage(page + 1, count)] : [fetchPage(page, count)]
	);

	const items = pages.flatMap((result) => result.items).slice(skip, skip + count);
	const more = pages.at(-1)!.more;

	return { items, next: more && items.length ? offset + items.length : null };
}

export const toOffset = (cursor: string | null): number => {
	const offset = Number(cursor);
	return Number.isInteger(offset) && offset > 0 ? offset : 0;
};
