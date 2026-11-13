import { redirect } from '@sveltejs/kit';

import { RequestError } from './http';
import { toHttpError } from './load';

const MAX_LENGTH = 200;

export function requireParam(value: string | null | undefined): string {
	// eslint-disable-next-line no-control-regex
	if (!value || value.length > MAX_LENGTH || /[\u0000-\u001f]/.test(value)) {
		throw new RequestError(400, 'error.id');
	}

	return value;
}

export function resolveOrFail<T>(resolve: () => T): T {
	try {
		return resolve();
	} catch (err) {
		toHttpError(err);
	}
}

export function redirectToCanonical(url: URL, current: string[], canonical: string[]): void {
	if (current.every((segment, i) => segment === canonical[i])) return;

	const prefix = url.pathname.split('/')[1];
	redirect(308, encodeURI(`/${prefix}/${canonical.join('/')}`) + url.search);
}
