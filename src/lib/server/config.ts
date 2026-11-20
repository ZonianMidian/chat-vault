import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface AppConfig {
	server: {
		port: number;
	};
	redis: {
		enabled: boolean;
		host: string;
		port: number;
		username: string;
		password: string;
		db: number;
		tls: boolean;
		keyPrefix: string;
	};
	cache: {
		staleAfter: number;
	};
	http: {
		timeout: number;
		userAgent: string;
	};
	youtube: {
		apiKey: string;
		invidious: string;
		cookie: string;
	};
	auth: {
		betterttv: string;
	};
	log: {
		level: 'debug' | 'info' | 'warn' | 'error';
		slowRequest: number;
	};
}

const defaults: AppConfig = {
	server: { port: 4935 },
	redis: {
		enabled: true,
		host: '127.0.0.1',
		port: 6379,
		username: '',
		password: '',
		db: 0,
		tls: false,
		keyPrefix: 'cv:'
	},
	cache: { staleAfter: 300 },
	http: { timeout: 15000, userAgent: '' },
	youtube: { apiKey: '', invidious: '', cookie: '' },
	auth: { betterttv: '' },
	log: { level: 'info', slowRequest: 5000 }
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, override: unknown, path = ''): T {
	if (!isPlainObject(base) || !isPlainObject(override)) return base;

	const result: Record<string, unknown> = { ...base };
	for (const [key, value] of Object.entries(override)) {
		const location = path ? `${path}.${key}` : key;

		if (!(key in base)) continue;

		const current = base[key];
		if (isPlainObject(current)) {
			result[key] = merge(current, value, location);
		} else if (typeof value === typeof current) {
			result[key] = value;
		} else {
			throw new Error(`[Config] "${location}" must be of type ${typeof current}`);
		}
	}

	return result as T;
}

function loadConfig(): AppConfig {
	const path = resolve(process.cwd(), process.env.CHAT_VAULT_CONFIG ?? 'config.json');

	if (!existsSync(path)) {
		console.warn(
			`[Config] ${path} not found, using defaults. Copy example_config.json to config.json.`
		);
		return defaults;
	}

	try {
		return merge(defaults, JSON.parse(readFileSync(path, 'utf8')));
	} catch (err) {
		throw new Error(`[Config] Could not load ${path}: ${(err as Error).message}`, {
			cause: err
		});
	}
}

export const config: AppConfig = loadConfig();
