import type { Provider } from '#lib/providers.ts';

import { resolveProvider } from '#lib/providers.ts';

export interface EmoteMatch {
	provider: Provider;
	id: string;
}

interface LinkRule {
	provider: Provider;
	hosts: string[];
	path: RegExp;
}

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const OBJECT_ID = /^[0-9a-f]{24}$/i;
const TWITCH_ID = /^(?:emotesv2_[0-9a-f]{32}(?:_[A-Z]{2})?|\d{1,12})$/;

const rules: LinkRule[] = [
	{ provider: '7tv', hosts: ['7tv.app', '7tv.io'], path: /^\/(?:v\d\/)?emotes?\/([0-9A-Za-z]+)/ },
	{
		provider: 'bttv',
		hosts: ['betterttv.com', 'betterttv.net'],
		path: /^\/emotes?\/([0-9a-f]{24})/i
	},
	{
		provider: 'ffz',
		hosts: ['frankerfacez.com'],
		path: /^\/(?:v\d\/)?(?:emoticon|emote)\/(\d+)/
	},
	{
		provider: 'twitch',
		hosts: ['jtvnw.net'],
		path: /^\/emoticons\/v\d\/(emotesv2_[0-9a-f]{32}(?:_[A-Z]{2})?|\d+)/
	},
	{ provider: 'kick', hosts: ['kick.com'], path: /^\/emotes\/(\d+)/ }
];

const matchesHost = (hostname: string, hosts: string[]): boolean =>
	hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));

export function getEmoteByLink(text: string): EmoteMatch | null {
	let url: URL;

	try {
		url = new URL(/^[a-z]+:\/\//i.test(text.trim()) ? text.trim() : `https://${text.trim()}`);
	} catch {
		return null;
	}

	const hostname = url.hostname.toLowerCase();

	for (const rule of rules) {
		if (!matchesHost(hostname, rule.hosts)) continue;

		const id = url.pathname.match(rule.path)?.[1];
		if (id) return { provider: rule.provider, id };
	}

	const own = url.pathname.match(/\/emote\/([^/]+)\/(.+?)\/?$/);
	const provider = own && resolveProvider(own[1]);

	return provider && own ? { provider, id: decodeURIComponent(own[2]) } : null;
}

export function emoteIdCandidates(text: string): EmoteMatch[] {
	const id = text.trim();
	const candidates: Provider[] = [];

	if (ULID.test(id)) candidates.push('7tv');
	if (OBJECT_ID.test(id)) candidates.push('bttv', '7tv');
	if (/^\d{1,9}$/.test(id)) candidates.push('ffz');
	if (TWITCH_ID.test(id)) candidates.push('twitch');

	return candidates.map((provider) => ({ provider, id }));
}
