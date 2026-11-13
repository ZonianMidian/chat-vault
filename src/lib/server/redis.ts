import { building } from '$app/env';
import { Redis } from 'ioredis';

import { config } from './config';
import { log } from './logger';

const state = globalThis as typeof globalThis & {
	__chatVaultRedis?: { client: Redis; warned: boolean };
};

function connect(): Redis {
	const { host, port, username, password, db, tls, keyPrefix } = config.redis;

	const client = new Redis({
		host,
		port,
		db,
		keyPrefix,
		username: username || undefined,
		password: password || undefined,
		tls: tls ? {} : undefined,
		connectTimeout: 5000,
		enableOfflineQueue: false,
		maxRetriesPerRequest: 1,
		retryStrategy: (attempt) => Math.min(attempt * 500, 15000)
	});

	client.on('error', (err: Error) => {
		const current = state.__chatVaultRedis;
		if (current && !current.warned) {
			current.warned = true;
			log.warn(
				'Redis',
				`Unavailable (${err.message || err.name}). Using the in-memory cache until it reconnects.`
			);
		}
	});

	client.on('ready', () => {
		if (state.__chatVaultRedis) state.__chatVaultRedis.warned = false;
		log.info('Redis', `Connected to ${host}:${port}`);
	});

	return client;
}

export function getRedis(): Redis | null {
	if (building || !config.redis.enabled) return null;

	state.__chatVaultRedis ??= { client: connect(), warned: false };

	const { client } = state.__chatVaultRedis;
	return client.status === 'ready' ? client : null;
}
