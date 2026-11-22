import type { Badge, Badges, ChannelData, Emote, Emotes, Set, User } from '#lib/types/common.ts';

import { getImageSizes } from '#lib/utils/images.ts';
import { getChannelPath } from '#lib/utils/text.ts';

export type Schema = Record<string, unknown>;

export interface Breadcrumb {
	name: string;
	path?: string;
}

export type PageType =
	'WebPage' | 'ItemPage' | 'ProfilePage' | 'CollectionPage' | 'SearchResultsPage';

export interface PageImage {
	url: string;
	width?: number | null;
	height?: number | null;
	caption?: string | null;
}

function toIsoDate(value: Date | string | null | undefined): string | undefined {
	if (!value) return undefined;

	const date = new Date(value);
	return isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export const absolute = (origin: string, url: string): string =>
	url.startsWith('//') ? `https:${url}` : url.startsWith('/') ? `${origin}${url}` : url;

export const shareableImage = (url: string): string => url.replace(/\.avif(?=$|\?)/, '.webp');

function clean(schema: Schema): Schema {
	return Object.fromEntries(
		Object.entries(schema).filter(
			([, value]) =>
				value !== undefined &&
				value !== null &&
				value !== '' &&
				!(Array.isArray(value) && value.length === 0)
		)
	);
}

const unique = (values: (string | null | undefined)[]): string[] => [
	...new Set(values.filter((value): value is string => !!value))
];

export function toJsonLd(schema: Schema): string {
	const json = JSON.stringify(schema).replace(/</g, '\\u003c');

	return `<script type="application/ld+json">${json}</` + 'script>';
}

function imageObject(origin: string, image: PageImage): Schema {
	return clean({
		'@type': 'ImageObject',
		name: image.caption,
		contentUrl: absolute(origin, image.url),
		width: image.width,
		height: image.height,
		caption: image.caption
	});
}

function person(origin: string, user: User | null | undefined): Schema | undefined {
	if (!user?.username) return undefined;

	return clean({
		'@type': 'Person',
		name: user.username,
		image: user.avatar ? absolute(origin, user.avatar) : undefined,
		url: `${origin}${getChannelPath(user)}`,
		sameAs: user.source
	});
}

const CONTEXT = 'https://schema.org';

export interface SiteSearch {
	name: string;
	path: string;
}

export function websiteSchema(
	origin: string,
	description: string,
	locale: string,
	searches: SiteSearch[]
): Schema {
	return {
		'@context': CONTEXT,
		'@type': 'WebSite',
		name: 'Chat Vault',
		url: `${origin}/`,
		description,
		inLanguage: locale,
		potentialAction: searches.map((search) => ({
			'@type': 'SearchAction',
			name: search.name,
			target: {
				'@type': 'EntryPoint',
				name: search.name,
				urlTemplate: `${origin}${search.path}?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}))
	};
}

export function breadcrumbSchema(origin: string, url: string, crumbs: Breadcrumb[]): Schema {
	const list: Breadcrumb[] = [{ name: 'Chat Vault', path: '/' }, ...crumbs];

	return {
		'@context': CONTEXT,
		'@type': 'BreadcrumbList',
		name: list.map((crumb) => crumb.name).join(' › '),
		itemListElement: list.map((crumb, i, list) =>
			clean({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.name,
				item: crumb.path
					? `${origin}${crumb.path}`
					: i === list.length - 1
						? url
						: undefined
			})
		)
	};
}

export interface PageDetails {
	origin: string;
	url: string;
	locale: string;
	type: PageType;
	title: string;
	name: string;
	description: string;
	image: PageImage;
	source?: string | null;
	datePublished?: Date | string | null;
	dateModified?: Date | string | null;
	mainEntity?: Schema | null;
}

export function webPageSchema(details: PageDetails): Schema {
	const { mainEntity } = details;

	const type = details.type === 'ProfilePage' && !mainEntity ? 'WebPage' : details.type;
	const isProfile = type === 'ProfilePage';

	return clean({
		'@context': CONTEXT,
		'@type': type,
		'@id': details.url,
		url: details.url,
		name: details.title,
		headline: details.name,
		description: details.description,
		inLanguage: details.locale,
		isPartOf: { '@type': 'WebSite', name: 'Chat Vault', url: `${details.origin}/` },
		primaryImageOfPage: imageObject(details.origin, details.image),
		mainEntity,
		isBasedOn: details.source,
		dateCreated: isProfile ? toIsoDate(details.datePublished) : undefined,
		datePublished: isProfile ? undefined : toIsoDate(details.datePublished),
		dateModified: toIsoDate(details.dateModified)
	});
}

export function entitySchema(entity: Schema, url: string): Schema {
	return { '@context': CONTEXT, ...entity, mainEntityOfPage: url };
}

export function largestImage(
	origin: string,
	kind: 'emote' | 'badge',
	item: { images: string[]; provider: string; name: string }
): PageImage | null {
	const index = item.images.length - 1;
	const source = item.images[index];
	if (!source) return null;

	const sizes = getImageSizes(kind, item.provider);
	const size = sizes[Math.min(index, sizes.length - 1)];

	return {
		url: absolute(origin, shareableImage(source)),
		width: size?.width,
		height: size?.height,
		caption: item.name
	};
}

interface ImageDetails {
	origin: string;
	url: string;
	description: string;
	credit: string;
	createdAt?: Date | string | null;
}

function imageEntity(
	kind: 'emote' | 'badge',
	item: Emote | Badge,
	details: ImageDetails,
	extra: Schema
): Schema {
	const { origin } = details;
	const largest = largestImage(origin, kind, item);
	const smallest = item.images[0];

	return clean({
		'@type': 'ImageObject',
		name: item.name,
		caption: item.name,
		description: details.description,
		url: details.url,
		contentUrl: largest?.url,
		width: largest?.width,
		height: largest?.height,
		thumbnailUrl: smallest ? absolute(origin, shareableImage(smallest)) : undefined,
		representativeOfPage: true,
		creditText: details.credit,
		datePublished: toIsoDate(details.createdAt),
		sameAs: item.source,
		...extra
	});
}

interface EmoteDetails extends ImageDetails {
	setName?: string | null;
	usageName?: string | null;
}

export function emoteSchema(emote: Emote, details: EmoteDetails): Schema {
	const { origin } = details;

	return imageEntity('emote', emote, details, {
		creator: person(origin, emote.artist ?? emote.owner),
		copyrightHolder: person(origin, emote.owner),
		keywords: unique([emote.name, ...emote.tags]).join(', '),
		isPartOf: emote.setId
			? clean({
					'@type': 'Collection',
					name: details.setName,
					url: `${origin}/set/${emote.provider}/${emote.setId}`
				})
			: undefined,
		interactionStatistic: emote.channels.total
			? {
					'@type': 'InteractionCounter',
					name: details.usageName ?? undefined,
					interactionType: 'https://schema.org/UseAction',
					userInteractionCount: emote.channels.total
				}
			: undefined
	});
}

export function badgeSchema(badge: Badge, details: ImageDetails): Schema {
	const owner = person(details.origin, badge.owner);

	return imageEntity('badge', badge, details, { creator: owner, copyrightHolder: owner });
}

export function channelSchema(
	channel: ChannelData,
	origin: string,
	followersName?: string | null
): Schema {
	const { user } = channel;

	return clean({
		'@type': 'Person',
		name: user.username,
		alternateName:
			user.slug && user.slug.toLowerCase() !== user.username.toLowerCase()
				? user.slug
				: undefined,
		identifier: user.id,
		description: user.bio,
		image: absolute(origin, shareableImage(user.images.avatar)),
		url: channel.source,
		sameAs: unique([channel.source, ...user.socials.map((social) => social.url)]),
		interactionStatistic:
			typeof user.followers === 'number'
				? {
						'@type': 'InteractionCounter',
						name: followersName ?? undefined,
						interactionType: 'https://schema.org/FollowAction',
						userInteractionCount: user.followers
					}
				: undefined
	});
}

interface ListDetails {
	origin: string;
	url: string;
	name: string;
	description?: string | null;
	section: 'emote' | 'badge';
}

function listItems(items: (Emotes | Badges)[], { origin, section }: ListDetails): Schema[] {
	return items.map((item, i) => {
		const version = 'version' in item && item.version ? `/${item.version}` : '';

		return {
			'@type': 'ListItem',
			position: i + 1,
			name: 'title' in item ? item.title : item.name,
			image: absolute(origin, shareableImage(item.image)),
			url: `${origin}/${section}/${item.provider}/${encodeURIComponent(item.id)}${version}`
		};
	});
}

function itemList(items: (Emotes | Badges)[], details: ListDetails): Schema {
	return {
		'@type': 'ItemList',
		name: details.name,
		numberOfItems: items.length,
		itemListElement: listItems(items, details)
	};
}

export function collectionSchema(items: (Emotes | Badges)[], details: ListDetails): Schema {
	return clean({
		'@type': 'Collection',
		name: details.name,
		description: details.description,
		url: details.url,
		collectionSize: items.length,
		hasPart: itemList(items, details)
	});
}

export function setSchema(set: Set, details: Omit<ListDetails, 'section'>): Schema {
	const { origin } = details;

	return clean({
		'@type': 'Collection',
		name: details.name,
		description: details.description,
		url: details.url,
		sameAs: set.source,
		keywords: set.tags.join(', '),
		author: person(origin, set.owner),
		image: set.owner?.avatar ? absolute(origin, set.owner.avatar) : undefined,
		collectionSize: set.emotes.length,
		hasPart: itemList(set.emotes, { ...details, section: 'emote' })
	});
}
