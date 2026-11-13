import { config } from './config';
import { log } from './logger';

export class ProviderError extends Error {
	constructor(
		readonly source: string,
		readonly status: number
	) {
		super(`${source} | ${status}`);
		this.name = 'ProviderError';
	}
}

export class RequestError extends Error {
	constructor(
		readonly status: number,
		readonly key: string
	) {
		super(key);
		this.name = 'RequestError';
	}
}

export interface RequestOptions extends RequestInit {
	timeout?: number;
}

function describeUrl(url: string | URL): string {
	const { host, pathname } = new URL(url);
	return host + pathname;
}

export async function request(
	url: string | URL,
	{ timeout, ...init }: RequestOptions = {}
): Promise<Response> {
	const headers = new Headers(init.headers);
	if (config.http.userAgent && !headers.has('user-agent')) {
		headers.set('user-agent', config.http.userAgent);
	}

	const method = init.method ?? 'GET';
	const target = `${method} ${describeUrl(url)}`;
	const started = Date.now();

	try {
		const res = await fetch(url, {
			...init,
			headers,
			signal: init.signal ?? AbortSignal.timeout(timeout ?? config.http.timeout)
		});

		const elapsed = Date.now() - started;

		if (res.status >= 500 || res.status === 429 || res.status === 403) {
			log.warn('HTTP', `${target} answered ${res.status} in ${elapsed}ms`);
		} else if (elapsed >= config.log.slowRequest) {
			log.warn('HTTP', `${target} was slow: ${res.status} in ${elapsed}ms`);
		} else {
			log.debug('HTTP', `${target} ${res.status} in ${elapsed}ms`);
		}

		return res;
	} catch (err) {
		const reason = (err as Error).name === 'TimeoutError' ? 'timed out' : 'failed';
		log.error('HTTP', `${target} ${reason} after ${Date.now() - started}ms`, err);
		throw err;
	}
}

export async function requestOk(
	source: string,
	url: string | URL,
	options?: RequestOptions
): Promise<Response> {
	let res: Response;

	try {
		res = await request(url, options);
	} catch {
		throw new ProviderError(source, 503);
	}

	if (!res.ok) {
		throw new ProviderError(source, res.status);
	}

	return res;
}

export async function requestJson<T>(
	source: string,
	url: string | URL,
	options?: RequestOptions
): Promise<T> {
	const res = await requestOk(source, url, options);

	try {
		return (await res.json()) as T;
	} catch {
		log.error('HTTP', `${describeUrl(url)} did not answer with JSON`, source);
		throw new ProviderError(source, 502);
	}
}

export async function exists(url: string): Promise<boolean> {
	try {
		const res = await request(url, { method: 'HEAD' });
		return res.ok;
	} catch {
		return false;
	}
}
