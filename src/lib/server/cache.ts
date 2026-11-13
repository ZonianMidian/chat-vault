import { isPresent } from '#lib/utils/index.ts';

import { ProviderError } from './http';
import { getRedis } from './redis';
import { config } from './config';
import { log } from './logger';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface CacheProfile {
	staleAfter: number;
	expireAfter: number | null;
	allowEmpty?: boolean;
}

export const profiles = {
	globals: { staleAfter: config.cache.staleAfter, expireAfter: null },
	origins: { staleAfter: 2 * config.cache.staleAfter, expireAfter: null },
	entity: { staleAfter: config.cache.staleAfter, expireAfter: DAY },
	live: { staleAfter: MINUTE, expireAfter: 30 * MINUTE, allowEmpty: true },
	list: { staleAfter: config.cache.staleAfter, expireAfter: 6 * HOUR, allowEmpty: true },
	extras: { staleAfter: 2 * config.cache.staleAfter, expireAfter: DAY, allowEmpty: true },
	static: { staleAfter: 6 * HOUR, expireAfter: 7 * DAY, allowEmpty: true }
} satisfies Record<string, CacheProfile>;

interface Entry<T> {
	v?: T;
	t: number;
	e?: { source: string; status: number };
}

const RETENTION = 7 * DAY;
const NEGATIVE_TTL = MINUTE;
const RETRY_DELAY = 30 * 1000;
const MEMORY_TTL = 15 * 1000;
const MEMORY_LIMIT = 1000;

const memory = new Map<string, { entry: Entry<unknown>; seen: number }>();
const inflight = new Map<string, Promise<unknown>>();
const retryAt = new Map<string, number>();
const refreshing = new Set<string>();

function remember(key: string, entry: Entry<unknown>): void {
	memory.delete(key);
	memory.set(key, { entry, seen: Date.now() });

	if (memory.size > MEMORY_LIMIT) {
		memory.delete(memory.keys().next().value as string);
	}
}

async function read<T>(key: string): Promise<Entry<T> | null> {
	const redis = getRedis();
	const local = memory.get(key);

	if (local && (!redis || Date.now() - local.seen < MEMORY_TTL)) {
		return local.entry as Entry<T>;
	}

	if (!redis) return null;

	try {
		const raw = await redis.get(key);
		if (!raw) {
			memory.delete(key);
			return null;
		}

		const entry = JSON.parse(raw) as Entry<T>;
		remember(key, entry);
		return entry;
	} catch (err) {
		log.warn('Cache', `Could not read "${key}"`, err);
		return (local?.entry as Entry<T>) ?? null;
	}
}

async function write<T>(key: string, entry: Entry<T>, ttl: number): Promise<void> {
	remember(key, entry);

	try {
		await getRedis()?.set(key, JSON.stringify(entry), 'EX', ttl);
	} catch (err) {
		log.warn('Cache', `Could not store "${key}"`, err);
	}
}

async function acquireRefresh(key: string): Promise<boolean> {
	try {
		const redis = getRedis();
		if (!redis) return true;

		return (await redis.set(`lock:${key}`, '1', 'EX', 30, 'NX')) === 'OK';
	} catch {
		return true;
	}
}

function refresh<T>(key: string, profile: CacheProfile, fetcher: () => Promise<T>): Promise<T> {
	const pending = inflight.get(key);
	if (pending) return pending as Promise<T>;

	const task = (async () => {
		const started = Date.now();

		try {
			const value = await fetcher();

			if (profile.allowEmpty || isPresent(value)) {
				await write(key, { v: value, t: Date.now() }, profile.expireAfter ?? RETENTION);
			} else {
				log.warn('Cache', `"${key}" came back empty and was not stored`);
			}

			retryAt.delete(key);
			log.debug('Cache', `Fetched "${key}" in ${Date.now() - started}ms`);

			return value;
		} catch (err) {
			retryAt.set(key, Date.now() + RETRY_DELAY);
			throw err;
		}
	})().finally(() => inflight.delete(key));

	inflight.set(key, task);
	return task;
}

function refreshInBackground<T>(
	key: string,
	profile: CacheProfile,
	fetcher: () => Promise<T>
): void {
	if (refreshing.has(key) || inflight.has(key) || (retryAt.get(key) ?? 0) > Date.now()) return;

	refreshing.add(key);

	acquireRefresh(key)
		.then((acquired) => (acquired ? refresh(key, profile, fetcher) : undefined))
		.catch((err: Error) => {
			log.warn('Cache', `Could not refresh "${key}", serving the previous copy`, err);
		})
		.finally(() => refreshing.delete(key));
}

export async function peek<T>(key: string): Promise<T | null> {
	const entry = await read<T>(key);
	return entry && !entry.e && entry.v !== undefined ? entry.v : null;
}

export async function storeAll(values: Map<string, unknown>, ttl: number): Promise<void> {
	if (!values.size) return;

	const redis = getRedis();
	const t = Date.now();

	if (!redis) {
		for (const [key, v] of values) remember(key, { v, t });
		return;
	}

	try {
		const pipeline = redis.pipeline();
		for (const [key, v] of values) pipeline.set(key, JSON.stringify({ v, t }), 'EX', ttl);

		await pipeline.exec();
	} catch (err) {
		log.warn('Cache', `Could not store ${values.size} values`, err);
	}
}

export async function cached<T>(
	key: string,
	profile: CacheProfile,
	fetcher: () => Promise<T>
): Promise<T> {
	const entry = await read<T>(key);
	const age = entry ? (Date.now() - entry.t) / 1000 : Infinity;

	if (entry?.e) {
		if (age < NEGATIVE_TTL) throw new ProviderError(entry.e.source, entry.e.status);
	} else if (entry && (profile.expireAfter === null || age < profile.expireAfter)) {
		if (age >= profile.staleAfter) {
			refreshInBackground(key, profile, fetcher);
		}

		return entry.v as T;
	}

	try {
		return await refresh(key, profile, fetcher);
	} catch (err) {
		if (entry && !entry.e) {
			log.warn('Cache', `Could not fetch "${key}", serving an expired copy`, err);
			return entry.v as T;
		}

		if (err instanceof ProviderError && err.status === 404) {
			const { source, status } = err;
			await write(key, { t: Date.now(), e: { source, status } }, NEGATIVE_TTL);
		}

		throw err;
	}
}
