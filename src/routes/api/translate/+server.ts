import type { RequestHandler } from './$types';

import { MAX_TRANSLATION_LENGTH, translateText } from '#lib/server/translate.ts';
import { RequestError } from '#lib/server/http.ts';
import { toHttpError } from '#lib/server/load.ts';

const MAX_TEXTS = 4;

function isValidText(value: unknown): value is string {
	return typeof value === 'string' && value.length <= MAX_TRANSLATION_LENGTH;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => null);
		const { texts, target } = body ?? {};

		if (
			typeof target !== 'string' ||
			!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(target) ||
			!Array.isArray(texts) ||
			texts.length > MAX_TEXTS ||
			!texts.every(isValidText)
		) {
			throw new RequestError(400, 'status.400');
		}

		return Response.json({
			translations: await Promise.all(texts.map((text) => translateText(text, target)))
		});
	} catch (err) {
		toHttpError(err);
	}
};
