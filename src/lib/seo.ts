import type { Badge, Badges, ChannelData, Emote, Emotes, Set, User } from '#lib/types/common.ts';

import { getChannelPath } from '#lib/utils/text.ts';

export type Schema = Record<string, unknown>;

export interface Breadcrumb {
	name: string;
	path?: string;
}

const SITE = 'Chat Vault';
const LIST_LIMIT = 30;

function toIsoDate(value: Date | string | null | undefined): string | undefined {
	if (!value) return undefined;

	const date = new Date(value);
	return isNaN(date.valueOf()) ? undefined : date.toISOString();
}

const absolute = (origin: string, url: string): string =>
	url.startsWith('/') ? `${origin}${url}` : url;

function clean(schema: Schema): Schema {
	return Object.fromEntries(
		Object.entries(schema).filter(
			([, value]) => value !== undefined && value !== null && value !== ''
		)
	);
}

function person(origin: string, user: User | null | undefined): Schema | undefined {
	if (!user?.username) return undefined;

	return clean({
		'@type': 'Person',
		name: user.username,
		image: user.avatar,
		url: `${origin}${getChannelPath(user)}`,
		sameAs: user.source
	});
}

export function toJsonLd(schema: Schema): string {
	const json = JSON.stringify(schema).replace(/</g, '\\u003c');

	return `<script type="application/ld+json">${json}</` + 'script>';
}

export function websiteSchema(origin: string, description: string): Schema {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE,
		url: origin,
		description,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${origin}/channel/search?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};
}

export function breadcrumbSchema(origin: string, crumbs: Breadcrumb[]): Schema {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: SITE, path: '/' }, ...crumbs].map((crumb, i) =>
			clean({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.name,
				item: crumb.path ? `${origin}${crumb.path}` : undefined
			})
		)
	};
}

interface ImageDetails {
	origin: string;
	url: string;
	description: string;
	credit: string;
	createdAt?: Date | string | null;
}

export function emoteSchema(emote: Emote, details: ImageDetails): Schema {
	const { origin } = details;
	const images = emote.images.map((image) => absolute(origin, image));

	return clean({
		'@context': 'https://schema.org',
		'@type': 'ImageObject',
		name: emote.name,
		description: details.description,
		url: details.url,
		mainEntityOfPage: details.url,
		contentUrl: images.at(-1),
		thumbnailUrl: images[0],
		creditText: details.credit,
		creator: person(origin, emote.artist ?? emote.owner),
		copyrightHolder: person(origin, emote.owner),
		datePublished: toIsoDate(details.createdAt),
		keywords: emote.tags.length ? emote.tags.join(', ') : undefined,
		isPartOf: emote.setId
			? {
					'@type': 'Collection',
					url: `${origin}/set/${emote.provider}/${emote.setId}`
				}
			: undefined,
		sameAs: emote.source
	});
}

export function badgeSchema(badge: Badge, details: ImageDetails): Schema {
	const { origin } = details;
	const images = badge.images.map((image) => absolute(origin, image));

	return clean({
		'@context': 'https://schema.org',
		'@type': 'ImageObject',
		name: badge.name,
		description: details.description,
		url: details.url,
		mainEntityOfPage: details.url,
		contentUrl: images.at(-1),
		thumbnailUrl: images[0],
		creditText: details.credit,
		creator: person(origin, badge.owner),
		datePublished: toIsoDate(details.createdAt),
		sameAs: badge.source
	});
}

export function channelSchema(channel: ChannelData, origin: string, url: string): Schema {
	const { user } = channel;

	return clean({
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		url,
		dateCreated: toIsoDate(user.createdAt),
		mainEntity: clean({
			'@type': 'Person',
			'@id': url,
			name: user.username,
			identifier: user.id,
			description: user.bio,
			image: absolute(origin, user.images.avatar),
			url: channel.source,
			sameAs: [channel.source, ...user.socials.map((social) => social.url)],
			interactionStatistic: {
				'@type': 'InteractionCounter',
				interactionType: 'https://schema.org/FollowAction',
				userInteractionCount: user.followers
			}
		})
	});
}

interface ListDetails {
	origin: string;
	url: string;
	name: string;
	description?: string | null;
	section: 'emote' | 'badge';
}

export function collectionSchema(items: (Emotes | Badges)[], details: ListDetails): Schema {
	const { origin, section } = details;

	return clean({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: details.name,
		description: details.description,
		url: details.url,
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: items.length,
			itemListElement: items.slice(0, LIST_LIMIT).map((item, i) => {
				const version = 'version' in item && item.version ? `/${item.version}` : '';

				return {
					'@type': 'ListItem',
					position: i + 1,
					name: 'title' in item ? item.title : item.name,
					image: absolute(origin, item.image),
					url: `${origin}/${section}/${item.provider}/${item.id}${version}`
				};
			})
		}
	});
}

export function setSchema(set: Set, details: Omit<ListDetails, 'section'>): Schema {
	return clean({
		...collectionSchema(set.emotes, { ...details, section: 'emote' }),
		author: person(details.origin, set.owner),
		sameAs: set.source
	});
}
