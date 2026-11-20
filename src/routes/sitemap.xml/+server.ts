import type { Badges, Emotes } from '#lib/types/common.ts';
import type { RequestHandler } from './$types';

import { fetchAllGlobalBadges } from '#lib/server/badges/fetchGlobals.ts';
import { fetchAllGlobalEmotes } from '#lib/server/emotes/fetchGlobals.ts';
import { resolveEmote } from '#lib/server/emotes/fetchEmote.ts';
import { absolute, shareableImage } from '#lib/seo.ts';
import { createTranslator } from '#lib/server/i18n.ts';
import { defaultLocale } from '#lib/i18n/index.ts';
import { log } from '#lib/server/logger.ts';

interface Entry {
	path: string;
	image?: string;
}

const STATIC_PAGES = [
	'/',
	'/emote',
	'/emote/global',
	'/emote/search',
	'/badge/global',
	'/channel/search'
];

const escapeXml = (text: string): string =>
	text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const segment = (value: string): string => encodeURIComponent(value);

function emoteEntry(emote: Emotes): Entry {
	const { provider, id } = resolveEmote(emote.provider, emote.id);

	return {
		path: `/emote/${segment(provider)}/${segment(id)}`,
		image: emote.image
	};
}

function badgeEntry(badge: Badges): Entry {
	const version = badge.version ? `/${segment(badge.version)}` : '';

	return {
		path: `/badge/${segment(badge.provider)}/${segment(badge.id)}${version}`,
		image: badge.image
	};
}

async function settle<T>(label: string, task: Promise<T[]>): Promise<T[]> {
	try {
		return await task;
	} catch (err) {
		log.warn('Sitemap', `${label} could not be listed`, err);
		return [];
	}
}

function render(origin: string, entries: Entry[]): string {
	const seen = new Set<string>();
	const urls: string[] = [];

	for (const entry of entries) {
		const loc = `${origin}${entry.path}`;
		if (seen.has(loc)) continue;
		seen.add(loc);

		const image = entry.image
			? `\n\t\t<image:image><image:loc>${escapeXml(absolute(origin, shareableImage(entry.image)))}</image:loc></image:image>`
			: '';

		urls.push(`\t<url>\n\t\t<loc>${escapeXml(loc)}</loc>${image}\n\t</url>`);
	}

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
		...urls,
		'</urlset>',
		''
	].join('\n');
}

export const GET: RequestHandler = async ({ url }) => {
	const [emotes, badges] = await Promise.all([
		settle('Global emotes', fetchAllGlobalEmotes()),
		settle('Global badges', fetchAllGlobalBadges(createTranslator(defaultLocale)))
	]);

	const entries: Entry[] = [
		...STATIC_PAGES.map((path) => ({ path })),
		...emotes.flatMap((emote) => {
			try {
				return [emoteEntry(emote)];
			} catch {
				return [];
			}
		}),
		...badges.map(badgeEntry)
	];

	return new Response(render(url.origin, entries), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
