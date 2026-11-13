import type { Badges, Emotes } from '#lib/types/common.ts';

import { normalizeText } from './text';

export function isPresent(v: unknown): boolean {
	if (v == null) return false; // null & undefined
	if (Array.isArray(v)) return v.length > 0; // array
	if (typeof v === 'number') return !isNaN(v); // number
	if (typeof v === 'string') return v.trim().length > 0; // string
	if (v instanceof Date) return !isNaN(v.valueOf()); // date
	if (v instanceof Map || v instanceof Set) return v.size > 0; // collection

	if (typeof v === 'object') {
		// plain object
		return Object.keys(v).length > 0;
	}

	return true;
}

export function groupByProvider<T extends { provider: string }>(items: T[]): Record<string, T[]> {
	const groups: Record<string, T[]> = {};
	for (const item of items) {
		(groups[item.provider] ??= []).push(item);
	}
	return groups;
}

export function sortBadges(badges: Badges[]): Badges[] {
	return [...badges].sort((a, b) => {
		const idCmp = a.id.localeCompare(b.id, undefined, {
			numeric: true,
			sensitivity: 'base'
		});
		if (idCmp !== 0) {
			return idCmp;
		}
		return Number(a.version.split('/')[0]) - Number(b.version.split('/')[0]);
	});
}

export function filterEmotes(emotes: Emotes[], search: string): Emotes[] {
	const term = normalizeText(search.trim());
	if (!term) return emotes;

	return emotes.filter(
		(e) => normalizeText(e.name).includes(term) || normalizeText(e.owner).includes(term)
	);
}

export function filterBadges(badges: Badges[], search: string): Badges[] {
	const term = normalizeText(search.trim());
	if (!term) return badges;

	return badges.filter(
		(e) =>
			normalizeText(e.id).includes(term) ||
			normalizeText(e.title).includes(term) ||
			normalizeText(e.provider).includes(term)
	);
}
