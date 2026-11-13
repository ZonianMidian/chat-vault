import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';

import { parseAcceptLanguage } from '#lib/utils/locale.ts';
import { loadAllLocales } from '#lib/server/i18n.ts';
import { parseTheme } from '#lib/tools/theme.ts';
import { resolveLocale } from '#lib/i18n/index.ts';
import { log } from '#lib/server/logger.ts';

export const handle: Handle = async ({ event, resolve }) => {
	await loadAllLocales();

	const locale = resolveLocale(
		event.cookies.get('locale'),
		...parseAcceptLanguage(event.request.headers.get('accept-language'))
	);
	const theme = parseTheme(event.cookies.get('theme'));

	event.locals.locale = locale;
	event.locals.theme = theme;

	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%lang%', locale).replace('%theme%', theme ? `data-theme="${theme}"` : '')
	});

	if (response.headers.get('content-type')?.startsWith('text/html')) {
		response.headers.set('Content-Language', locale);
		response.headers.append('Vary', 'Accept-Language, Cookie');
	}

	if (response.status >= 500) {
		log.warn(
			'Server',
			`${event.request.method} ${event.url.pathname} answered ${response.status}`
		);
	}

	return response;
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === 'unknown') {
		log.error('Server', `${event.request.method} ${event.url.pathname} failed`, error);
	}
};
