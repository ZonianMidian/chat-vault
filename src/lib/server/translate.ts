import { createHash } from 'node:crypto';

import { cached, profiles } from '#lib/server/cache.ts';
import { requestJson } from '#lib/server/http.ts';

export const MAX_TRANSLATION_LENGTH = 5000;

type TranslateResponse = [[string, string][] | null, ...unknown[]];

export function translateText(text: string, target: string): Promise<string> {
	if (!text.trim()) return Promise.resolve(text);

	const language = target.split('-')[0];
	const hash = createHash('sha256').update(text).digest('hex');

	return cached(`translation:${language}:${hash}`, profiles.static, async () => {
		const url = new URL('https://translate.googleapis.com/translate_a/single');
		url.search = new URLSearchParams({
			client: 'gtx',
			sl: 'auto',
			tl: language,
			dt: 't',
			q: text
		}).toString();

		const data = await requestJson<TranslateResponse>('[Translate]', url);

		return (data[0] ?? []).map(([translated]) => translated).join('');
	});
}
