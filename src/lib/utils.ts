import type { Badges, Emotes, Roles, Sizes } from '$lib/types/common';
import type { Data } from './types/supibot';

import { unwrapFunctionStore, format, number } from 'svelte-i18n';
import { getCachedOriginData } from './emotes/originCache';
import { fetchGlobalBadges } from './badges/fetchGlobals';
import { fetchGlobalEmotes } from './emotes/fetchGlobals';
import { goto } from '$app/navigation';

export const $format = unwrapFunctionStore(format);
export const $number = unwrapFunctionStore(number);

export const imageProxy = 'https://wsrv.nl/?n=-1&url=';
export const proxyUrl = 'https://corsproxy.io/?url=';

export const UUID =
	/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g;

export const emoteVariants = [
	'BE',
	'BN',
	'BT',
	'BW',
	'CL',
	'EB',
	'EG',
	'EV',
	'FB',
	'FC',
	'FF',
	'GR',
	'HB',
	'HE',
	'HF',
	'KI',
	'LH',
	'MC',
	'PK',
	'PM',
	'RA',
	'RB',
	'RD',
	'SA',
	'SF',
	'SG',
	'SM',
	'SO',
	'SQ',
	'TK',
	'UN',
	'WD',
	'WH'
];

export const localeMapping = {
	zh: {
		'zh-Hant': 'zh-TW',
		'zh-TW': 'zh-TW',
		'zh-HK': 'zh-TW',
		'zh-MO': 'zh-TW',
		'zh-Hans': 'zh-CN',
		'zh-CN': 'zh-CN',
		'zh-SG': 'zh-CN',
		zh: 'zh-CN'
	},
	pt: {
		pt: 'pt-BR',
		'pt-BR': 'pt-BR',
		'pt-PT': 'pt-PT'
	}
} as const;

export const socialConfig: Record<string, string> = {
	instagram: 'https://instagram.com/',
	twitter: 'https://twitter.com/',
	youtube: 'https://youtube.com/',
	discord: 'https://discord.gg/',
	tiktok: 'https://tiktok.com/@',
	facebook: 'https://facebook.com/'
};

export async function checkVariantExists(url: string): Promise<boolean> {
	try {
		const response = await fetch(`${imageProxy}${url}`, { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
}

export function objectIdToUlid(objectId: string): string {
	const id = BigInt(`0x${objectId}`);

	const timestamp = (id >> 64n) * 1000n;
	const random = id & 0xffffffffffffffffn;

	return encodeULIDPart(timestamp, 10) + encodeULIDPart(random, 16);
}

function encodeULIDPart(part: bigint, size: number): string {
	const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	let result = '';

	for (let i = 0; i < size; i++) {
		result = alphabet[Number(part % 32n)] + result;
		part /= 32n;
	}

	return result;
}

export function ULIDToObjectId(ulid: string): string {
	const timestampPart = (decodeULIDPart(ulid, 10) / 1000n).toString(16).padStart(8, '0');

	const randomPart = decodeULIDPart(ulid.slice(10), 16).toString(16).padStart(16, '0');

	return timestampPart + randomPart;
}

function decodeULIDPart(part: string, size: number): bigint {
	const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	let result = 0n;

	for (let i = 0; i < size; i++) {
		result = result * 32n + BigInt(alphabet.indexOf(part[i]));
	}

	return result;
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function includesFromArray(str: string, arr: string[]): boolean {
	return arr.some((item) => str.includes(item));
}

export async function getImageInfo(url: string, proxy: boolean): Promise<Sizes> {
	if (includesFromArray(url, ['imgur', 'ivr', 'amazonaws'])) {
		proxy = true;
	} else if (includesFromArray(url, ['wsrv.nl']) || url.startsWith('/')) {
		proxy = false;
	}

	try {
		const response = await fetch(proxy ? imageProxy + url : url);
		if (!response.ok) {
			throw new Error($format('error.image'));
		}
		const blob = await response.blob();
		const size = formatFileSize(blob.size);
		const objectUrl = URL.createObjectURL(blob);

		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.width, height: img.height, size, objectUrl });
			};
			img.src = objectUrl;
		});
	} catch {
		return { width: null, height: null, size: null, objectUrl: url };
	}
}

export async function translateText(text: string, targetLang: string | null) {
	if (!text || !targetLang) {
		return text;
	}

	targetLang = targetLang?.split('-')[0];

	const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
		text
	)}`;
	const res = await fetch(url);
	const data = await res.json();
	return data[0].map((t: string) => t[0]).join('');
}

export function compareName(login: string | null, displayName: string | null): string {
	if (!login || !displayName) {
		return '';
	}

	const normalizedLogin = login?.toLowerCase() || '';
	const normalizedDisplayName = displayName?.toLowerCase() || '';

	return normalizedLogin === normalizedDisplayName ? displayName : login;
}

export async function getOrCacheData<T>(
	fetchFn: () => Promise<T | null>,
	cacheKey: string,
	cacheExpirationKey: string,
	cacheDuration: number,
	fallback: T
): Promise<T> {
	const storage = typeof window !== 'undefined' ? window.localStorage : null;

	const getItem = (key: string): string | null => storage?.getItem(key) ?? null;
	const setItem = (key: string, value: string): void => storage?.setItem(key, value);

	const now = Date.now();

	const tryFromCache = (): T | null => {
		const raw = getItem(cacheKey);
		const exp = getItem(cacheExpirationKey);
		if (!raw || !exp || now >= Number(exp)) return null;
		try {
			const data = JSON.parse(raw) as T;
			return isPresent(data) ? data : null;
		} catch {
			return null;
		}
	};

	const cached = tryFromCache();
	if (cached) return cached;

	const fetched = await fetchFn();
	if (isPresent(fetched)) {
		const serialized = JSON.stringify(fetched);
		setItem(cacheKey, serialized);
		setItem(cacheExpirationKey, String(now + cacheDuration));
		return fetched as T;
	}

	const rawFallback = getItem(cacheKey);
	if (rawFallback) {
		try {
			const data = JSON.parse(rawFallback) as T;
			if (isPresent(data)) return data;
		} catch {}
	}

	return fallback;
}

export function isPresent(v: any): boolean {
	if (v == null) return false; // null & undefined
	if (Array.isArray(v)) return v.length > 0; // array
	if (typeof v === 'number') return !isNaN(v); // number
	if (typeof v === 'string') return v.trim().length > 0; // string
	if (v instanceof Date) return !isNaN(v.valueOf()); // date
	if (ArrayBuffer.isView(v)) return v.byteLength > 0; // typed array & data view
	if (v instanceof ArrayBuffer) return v.byteLength > 0; // array buffer
	if (v instanceof Map || v instanceof Set) return v.size > 0; // collection
	if (v instanceof URLSearchParams) return [...v].length > 0; // URLSearchParams

	if (typeof v === 'object' && Symbol.iterator in v) {
		// iterable
		for (const _ of v) return true;
		return false;
	}

	if (typeof v === 'object') {
		// plain object
		for (const _ in v) return true;
		return false;
	}

	return true;
}

export function getBadges(roles: Roles) {
	const badges = [
		{ key: 'isStaff', title: $format('channel.staff') },
		{ key: 'isPartner', title: $format('channel.partner') },
		{ key: 'isAffiliate', title: $format('channel.affiliate') }
	];
	return badges
		.filter((badge) => roles[badge.key as keyof Roles])
		.map((badge) => ({
			src: `/icons/${badge.key}.svg`,
			alt: badge.title,
			title: badge.title
		}));
}

export function getElapsed(time: Date | null): string {
	if (!time) return '0:00:00';

	const start = new Date(time).getTime();
	const now = Date.now();
	const diffSec = Math.floor((now - start) / 1000);

	const hours = Math.floor(diffSec / 3600);
	const minutes = Math.floor((diffSec % 3600) / 60);
	const seconds = diffSec % 60;

	const hh = String(hours).padStart(2, '0');
	const mm = String(minutes).padStart(2, '0');
	const ss = String(seconds).padStart(2, '0');

	return `${hh}:${mm}:${ss}`;
}

export function formatDuration(months: number, isBadge: boolean = false): string {
	const key = isBadge ? 'badge' : 'channel';

	const tier = months >= 3000 ? 3 : months >= 2000 ? 2 : 1;
	months = tier > 1 ? months - tier * 1000 : months;

	if (months < 12) {
		return $format(`${key}.month`, {
			values: { count: months }
		});
	}

	const years = months / 12;
	const count = Number.isInteger(years) ? years.toString() : years.toFixed(1);

	return $format(`${key}.year`, {
		values: { count }
	});
}

export function generateString(length: number): string {
	const randomPart = Math.random().toString(36).substring(2);

	return randomPart.slice(0, length);
}

export function rezizeImageUrl(url: string, size: number): string {
	return `https://wsrv.nl/?url=${url}&w=${size}&h=${size}&n=-1&output=webp`;
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

export async function findEmoteOrigin(emoteId: string, type: string): Promise<Data | null> {
	const origin: Data[] = await getCachedOriginData();

	return origin.find((item) => item.emoteID === emoteId && item.type === type) ?? null;
}

export async function findGlobalEmote(emoteId: string, provider: string): Promise<Emotes | null> {
	const data: Emotes[] = await fetchGlobalEmotes('all');

	return data.find((item) => item.id === emoteId && item.provider === provider) ?? null;
}

export async function findGlobalBadge(
	badgeId: string,
	badgeVersion: string,
	type: string,
	all = false
): Promise<{ badge: Badges | null; related: Badges[] }> {
	if (!badgeId || !badgeVersion || !type) {
		return { badge: null, related: [] };
	}
	const data: Badges[] = await fetchGlobalBadges('all');

	const badge =
		data.find(
			(item) => item.id === badgeId && item.version === badgeVersion && item.provider === type
		) ?? null;

	let related: Badges[] = [];

	if (all) {
		related = data.filter((item) => item.id === badgeId && item.provider === type);
	} else {
		related = data.filter(
			(item) => item.id === badgeId && item.version !== badgeVersion && item.provider === type
		);
	}

	return {
		badge,
		related
	};
}

export async function updateURLPath(from: string, to: string) {
	const url = new URL(window.location.href);

	url.pathname = url.pathname.replace(new RegExp(from, 'i'), to);
	await goto(url.pathname + url.search + url.hash, {
		replaceState: true,
		keepFocus: true,
		noScroll: true
	});
}

export function getCheerName(input: string): string {
	const match = input.match(/^(.*)\s\d+$/);
	return match ? match[1] : input;
}

export function normalizeText(text: string | null): string {
	if (!text) return '';
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

export function filterEmotes(emotes: Emotes[], search: string): Emotes[] {
	if (!search.trim()) return emotes;

	const s = normalizeText(search.trim().toLowerCase());

	return emotes.filter(
		(e) =>
			normalizeText(e.name).toLowerCase().includes(s) ||
			normalizeText(e.owner).toLowerCase().includes(s) ||
			normalizeText(e.provider).toLowerCase().includes(s)
	);
}

export function getFavicon(url: string): { url: string; icon: string } {
	let fixed = url.trim();
	if (!/^https?:\/\//i.test(fixed)) {
		fixed = `https://${fixed}`;
	}

	const parsed = new URL(fixed);
	const path = parsed.pathname.replace(/\/+$/, '');
	const host = parsed.hostname.replace(/^www\./i, '');

	const cleanUrl = `${parsed.protocol}//${host}${path}`;

	return {
		url: cleanUrl,
		icon: `https://favicon.yandex.net/favicon/${host}?size=32`
	};
}

function levenshteinDistance(str1: string, str2: string): number {
	const matrix = Array(str2.length + 1)
		.fill(null)
		.map(() => Array(str1.length + 1).fill(null));

	for (let i = 0; i <= str1.length; i++) {
		matrix[0][i] = i;
	}

	for (let j = 0; j <= str2.length; j++) {
		matrix[j][0] = j;
	}

	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,
				matrix[j - 1][i] + 1,
				matrix[j - 1][i - 1] + substitutionCost
			);
		}
	}

	return matrix[str2.length][str1.length];
}

export function calculateSimilarity(searchTerm: string, username: string): number {
	const search = searchTerm.toLowerCase();
	const user = username.toLowerCase();

	if (user.includes(search)) {
		const startBonus = user.startsWith(search) ? 0.3 : 0;
		const lengthRatio = search.length / user.length;
		return 0.7 + startBonus + lengthRatio * 0.3;
	}

	const maxLength = Math.max(search.length, user.length);
	const distance = levenshteinDistance(search, user);
	return Math.max(0, (maxLength - distance) / maxLength);
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): {
	(...args: Parameters<T>): void;
	cancel: () => void;
	flush: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastArgs: Parameters<T>;
	let lastThis: any;

	function debounced(this: any, ...args: Parameters<T>): void {
		lastArgs = args;
		lastThis = this;

		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			timeoutId = null;
			func.apply(lastThis, lastArgs);
		}, wait);
	}

	debounced.cancel = (): void => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	debounced.flush = (): void => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
			func.apply(lastThis, lastArgs);
		}
	};

	return debounced;
}

export function normalizeLocale(locale: string): string {
	return locale.replace(/_/g, '-');
}

export function mapLocale(input: string, supported: string[]): string | null {
	if (!input) return null;

	const normalized = normalizeLocale(input);
	const [lang] = normalized.split('-');

	const langMapping = localeMapping[lang as keyof typeof localeMapping];
	if (langMapping) {
		const mapped =
			langMapping[normalized as keyof typeof langMapping] ||
			langMapping[lang as keyof typeof langMapping];
		if (mapped && supported.includes(mapped)) {
			return mapped;
		}
	}

	return null;
}

export function chooseSupported(value: string, supported: string[]): string | null {
	if (!value) return null;

	const normalized = normalizeLocale(value);

	if (supported.includes(normalized)) return normalized;

	const mapped = mapLocale(normalized, supported);
	if (mapped) return mapped;

	const baseLang = normalized.split('-')[0];
	if (supported.includes(baseLang)) return baseLang;

	return null;
}
