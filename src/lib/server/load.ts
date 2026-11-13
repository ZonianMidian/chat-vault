import { error, isHttpError, isRedirect, type RequestEvent } from '@sveltejs/kit';

import { ProviderError, RequestError } from './http';
import { log } from './logger';

export function toHttpError(err: unknown): never {
	if (isHttpError(err) || isRedirect(err)) throw err;

	if (err instanceof ProviderError) {
		const status = err.status >= 400 && err.status <= 599 ? err.status : 500;
		if (status !== 404) log.warn('Server', 'Upstream failure shown to the visitor', err);
		error(status, err.message, { source: err.source });
	}

	if (err instanceof RequestError) {
		error(err.status, err.key, { key: err.key });
	}

	log.error('Server', 'Unexpected error while loading data', err);
	error(500, 'Internal Error');
}

type Settled<T> = { [K in keyof T]: T[K] | Awaited<T[K]> };

export async function critical<T extends Record<string, Promise<unknown>>>(
	event: Pick<RequestEvent, 'isDataRequest'>,
	work: T
): Promise<Settled<T>> {
	const entries = Object.entries(work).map(
		([key, promise]) => [key, promise.catch(toHttpError)] as const
	);

	if (event.isDataRequest) {
		for (const [, promise] of entries) promise.catch(() => {});
		return Object.fromEntries(entries) as Settled<T>;
	}

	const settled = await Promise.all(
		entries.map(async ([key, promise]) => [key, await promise] as const)
	);
	return Object.fromEntries(settled) as Settled<T>;
}

export function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
	return promise.catch(() => fallback);
}
