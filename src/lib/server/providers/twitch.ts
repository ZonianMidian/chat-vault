import type { PageRequest, SearchPage } from '#lib/server/emotes/pages.ts';
import type { EmoteSearchOptions } from '#lib/emotes/search.ts';
import type { BadgeContext, EmoteContext } from './context';
import type { Translator } from '#lib/server/i18n.ts';
import type {
	ChannelData,
	Socials,
	Badges,
	Emotes,
	Emote,
	Badge,
	User,
	Set
} from '#lib/types/common.ts';
import type {
	TwitchEmote,
	SocialMedia,
	TwitchBadge,
	TwitchUser,
	TwitchSet,
	GQLEmote
} from '#lib/types/twitch.ts';

import { ProviderError, exists, request, requestJson } from '#lib/server/http.ts';
import ImageData from '#lib/server/emotes/data/images.json';
import { findOrigin } from '#lib/server/emotes/origins.ts';
import { findGlobalBadge } from './context';
import {
	getSubscriptionTier,
	generateString,
	getCheerName,
	compareName,
	escapeHtml,
	sortBadges,
	getFavicon,
	UUID
} from '#lib/utils/index.ts';

const API = 'https://api.spanix.team';

const twitchOwner: User = {
	id: '12826',
	avatar: `${API}/avatar/id/12826/150`,
	source: 'https://twitch.tv/Twitch',
	platform: 'twitch',
	username: 'Twitch'
};

export const customBadges = [
	'kc-subathon-2024',
	'ariatopia',
	'plaqueboymax-mixtape',
	'speed-does-america',
	'mafiathon-3-badge',
	'k4sen-con-2025',
	'1044725354-t-meow',
	'campaign'
];

const getType = (type: string, isGlobal = false): string | null => {
	switch (type) {
		case 'bits':
			return 'BITS_BADGE_TIERS';
		case 'subscriber':
			return 'SUBSCRIPTIONS';
		case 'flair':
			return 'FLAIR';
		case 'points':
			return 'CHANNEL_POINTS';
		default:
			if (isGlobal) return 'GLOBALS';

			if (type.startsWith('campaign')) {
				if (type.endsWith('mw')) return 'WATCHTIME';
				if (type.endsWith('sub')) return 'SUB_OR_GIFT';
			}

			if (customBadges.includes(type)) return 'SPECIAL_EVENT';
			return null;
	}
};

const languageHeaders = (locale: string): HeadersInit => ({
	'Accept-Language': locale.startsWith('en') ? locale : `${locale},en;q=0.9`
});

const emoteImage = (emoteId: string, scale = '3.0'): string =>
	`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/${scale}`;

export async function getTwitchEmote(emoteId: string, ctx: EmoteContext): Promise<Emote> {
	const source = '[Twitch] Emote';
	const url = `https://api.potat.app/twitch/emotes?id=${encodeURIComponent(emoteId)}`;
	const fallbackUrl = `https://api.ivr.fi/v2/twitch/emotes/${encodeURIComponent(emoteId)}?id=true`;

	let data: TwitchEmote | undefined;

	try {
		data = (await requestJson<{ data?: TwitchEmote[] }>(source, url)).data?.[0];
	} catch (err) {
		if (err instanceof ProviderError && err.status === 404) throw err;
		data = await requestJson<TwitchEmote>(source, fallbackUrl);
	}

	if (!data) {
		throw new ProviderError(source, 404);
	}

	let userName;
	let userId;
	if (data.emoteSetID === '0') {
		userName = 'Twitch';
		userId = '12826';
	} else {
		userName = compareName(data.channelLogin ?? null, data.channelName ?? null);
		userId = data.channelID;
	}

	const matchedItem = findOrigin(ctx.origins, emoteId, 'twitch');

	const images =
		(ImageData as Record<string, Record<string, string[]>>).twitch?.[emoteId] ??
		(matchedItem
			? matchedItem.url?.includes('i.ivr.fi')
				? [1, 2, 3].map((n) => matchedItem.url.replace('_3x.', `_${n}x.`))
				: matchedItem.url?.includes('i.imgur.com')
					? [matchedItem.url]
					: null
			: null);

	let altImage: string | null = null;
	if (emoteId.match(/_[A-Z]{2}$/)) {
		altImage = findOrigin(ctx.origins, emoteId.slice(0, -3), 'twitch')?.url ?? null;
	}

	const artist = data.artist ? compareName(data.artist.login, data.artist.displayName) : null;

	return {
		id: emoteId,
		name: data.emoteCode,
		provider: 'twitch',
		tags: [],
		artist:
			data.artist && artist
				? {
						id: data.artist.id,
						avatar: `${API}/avatar/id/${data.artist.id}/150`,
						source: `https://twitch.tv/${artist}`,
						username: artist,
						platform: 'twitch'
					}
				: null,
		owner: userId
			? {
					id: userId,
					avatar: `${API}/avatar/id/${userId}/150`,
					source: `https://twitch.tv/${userName}`,
					platform: 'twitch',
					username: userName ?? ''
				}
			: null,
		images: images ?? [
			emoteImage(emoteId, '1.0'),
			emoteImage(emoteId, '2.0'),
			emoteImage(emoteId, '3.0')
		],
		altImage,
		setId: data.emoteSetID,
		source: `https://twitch.tv/${data.emoteType === 'SUBSCRIPTIONS' ? 'subs/' : ''}${userName}`,
		createdAt: null,
		type: data.emoteType ?? null,
		approved: data.emoteState !== 'PENDING',
		public: data.emoteState === 'ACTIVE',
		animated: data.emoteAssetType === 'ANIMATED',
		tier: data.emoteTier,
		cost: data.emoteBitCost,
		global: !!ctx.global,
		deleted: data.emoteState === 'DELETED',
		channels: {
			total: 0,
			list: []
		}
	};
}

export async function getTwitchGlobalEmotes(): Promise<Emotes[]> {
	const set = await getTwitchSet('0');

	return set.emotes.map((emote) => ({
		id: emote.id,
		name: emote.name,
		image: emoteImage(emote.id),
		owner: emote.owner,
		provider: 'twitch'
	}));
}

export async function getTwitchSet(setId: string): Promise<Set> {
	const source = '[Twitch] Set';
	const data = await requestJson<TwitchSet[]>(
		source,
		`${API}/get_set/${encodeURIComponent(setId)}`
	);

	if (!data || data.length === 0) {
		throw new ProviderError(source, 404);
	}

	const set = data[0];
	const userName = set.channelID ? compareName(set.channelLogin, set.channelName) : 'Twitch';
	const subtitle =
		(!set.channelID && 'set.global') ||
		(set.tier && 'set.tier') ||
		(set.emoteList?.[0]?.type === 'FOLLOWER' && 'set.follower') ||
		(set.emoteList?.[0]?.type === 'BITS_BADGE_TIERS' && 'set.bits') ||
		null;

	return {
		id: setId,
		name: null,
		subtitle,
		tags: [],
		source: `https://twitch.tv/${set.tier ? 'subs/' : ''}${userName}`,
		provider: 'twitch',
		tier: set.tier ?? null,
		owner: {
			id: set.channelID ?? '12826',
			username: userName,
			avatar: `${API}/avatar/id/${set.channelID ?? '12826'}/150`,
			source: `https://twitch.tv/${userName}`,
			platform: 'twitch'
		},
		emotes: set.emoteList.map((emote) => ({
			id: emote.id,
			name: emote.code,
			image: emoteImage(emote.id),
			owner: emote.artist ? compareName(emote.artist.login, emote.artist.displayName) : null,
			provider: 'twitch'
		}))
	};
}

export async function getTwitchUser(user: string, isId = false): Promise<User> {
	const source = '[Twitch] User';
	const data = (
		await requestJson<{ user?: TwitchUser }>(
			source,
			`${API}/get_user/${isId ? 'id' : 'login'}/${encodeURIComponent(user)}`
		)
	)?.user;

	if (!data) {
		throw new ProviderError(source, 404);
	}

	const userName = compareName(data.login, data.displayName);

	return {
		id: data.id,
		username: userName,
		avatar: data.profileImageURL,
		source: `https://twitch.tv/${userName}`,
		platform: 'twitch'
	};
}

function defaultBanner(username: string, color: string | null): string {
	const name = escapeHtml(username);

	let text = '';
	while (text.length < 112) {
		text += (text ? ' ' : '') + name;
	}

	const font =
		'fill="#fff" font-size="4rem" font-weight="600" opacity=".1" font-family="Roobert,Helvetica Neue,Helvetica,Arial,sans-serif"';

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" height="200">` +
		`<rect width="100%" height="100%" fill="${color ? `#${escapeHtml(color)}` : '#cba6f7'}"/>` +
		`<text x="15" y="27%" ${font}>${text}</text>` +
		`<text x="5" y="60%" ${font}>${text.slice(4)}</text>` +
		`<text y="93%" ${font}>${text.slice(2)}</text>` +
		`</svg>`;

	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function mapSocials(list: SocialMedia[] | null | undefined): Socials[] {
	return (list ?? []).flatMap(({ url, name, title }) => {
		try {
			const { url: cleanUrl, icon } = getFavicon(url);
			return [{ name, title, url: cleanUrl, icon }];
		} catch {
			return [];
		}
	});
}

export async function getTwitchChannel(userLogin: string, i18n: Translator): Promise<ChannelData> {
	const source = '[Twitch] Channel';
	const { user: data } = await requestJson<{ user?: TwitchUser }>(
		source,
		`${API}/get_info/${encodeURIComponent(userLogin)}`
	);

	if (!data) throw new ProviderError(source, 404);

	const banner = data.bannerImageURL ?? defaultBanner(data.login, data.primaryColorHex);

	const mapEmotes = (list: GQLEmote[] | null | undefined): Emotes[] =>
		(list ?? []).map((e) => ({
			id: e.id,
			name: e.code,
			image: emoteImage(e.id),
			owner: e.artist ? compareName(e.artist.login, e.artist.displayName) : null,
			provider: 'twitch',
			value: e.bits?.cost ? i18n.number(Number(e.bits.cost)) : undefined
		}));

	const { channel, subEmotes, cheer, broadcastBadges } = data;

	const followerEmotes = channel.localEmoteSets?.[0]?.localEmotes ?? [];
	const bitsEmotes = cheer?.badgeTierEmotes ?? [];

	const subs = Array.from({ length: 3 }, (_, i) => {
		const tier = subEmotes?.[i];

		return {
			title: tier?.displayName ?? '',
			emotes: mapEmotes(tier?.emotes),
			flair: i > 0 ? channel?.creatorBadgeFlair?.assets?.[i - 1]?.image_url_4x : undefined,
			badges: [] as Badges[]
		};
	});

	const userName = compareName(data.login, data.displayName);
	const points = channel.communityPointsSettings;

	const response = {
		provider: 'twitch',
		source: `https://twitch.tv/${userName}`,
		user: {
			id: data.id,
			color: data.chatColor ?? '#666666',
			backgroundColor: data.primaryColorHex ? `#${data.primaryColorHex}` : '#cba6f7',
			createdAt: data.createdAt,
			bio: data.description?.length ? data.description : null,
			username: userName,
			slug: data.login,
			followers: data.followers.count,
			roles: data.roles,
			socials: mapSocials(channel.socialMedias),
			badge: data.selectedBadge && {
				id: data.selectedBadge.setID,
				title: data.selectedBadge.title,
				version: data.selectedBadge.version,
				image: data.selectedBadge.image_url_2x
			},
			images: {
				avatar: data.profileImageURL,
				banner
			},
			offline: { title: data.lastBroadcast?.title, image: data.offlineImageURL ?? banner },
			stream: data.stream && {
				title: data.stream.title,
				language: data.stream.language,
				isMature: data.stream.isMature,
				createdAt: data.stream.createdAt,
				viewers: data.stream.viewersCount,
				preview: `${data.stream.previewImageURL.replace('-{width}x{height}', '-640x360')}?${generateString(5)}`,
				category: data.stream.game
					? {
							url: `https://twitch.tv/directory/category/${data.stream.game.slug}`,
							name: data.stream.game.displayName,
							boxArt: data.stream.game.boxArt.replace('-{width}x{height}', '-285x380')
						}
					: null
			}
		},
		content: {
			follower: {
				emotes: mapEmotes(followerEmotes),
				badges: [] as Badges[]
			},
			sub: subs[0],
			subT2: subs[1],
			subT3: subs[2],
			bits: {
				emotes: mapEmotes(bitsEmotes),
				badges: [] as Badges[]
			},
			special: {
				emotes: [] as Emotes[],
				badges: [] as Badges[]
			},
			campaign: {
				emotes: [] as Emotes[],
				badges: [] as Badges[]
			},
			points: {
				image: points.image?.image_url_4x ?? points.defaultImage.image_url_4x,
				name: points.name ?? i18n.t('channel.points')
			}
		}
	} satisfies ChannelData;

	const { content } = response;

	[...(broadcastBadges ?? [])]
		.sort((a, b) => Number(a.version) - Number(b.version))
		.forEach((badge) => {
			const base = {
				id: badge.setID,
				version: `${badge.version}/${data.id}`,
				description: badge.description,
				image: badge.image_url_4x,
				provider: 'twitch'
			};

			if (badge.setID.startsWith('campaign')) {
				content.campaign.badges.push({
					...base,
					title: badge.title,
					type: getType(badge.setID, false)
				});
			} else if (customBadges.includes(badge.setID)) {
				content.special.badges.push({
					...base,
					title: badge.title,
					type: 'SPECIAL_EVENT'
				});
			} else if (badge.setID === 'bits') {
				content.bits.badges.push({
					...base,
					title: getCheerName(badge.title),
					value: i18n.number(Number(badge.version)),
					type: 'BITS_BADGE_TIERS'
				});
			} else if (badge.setID === 'subscriber') {
				const versionNum = Number(badge.version);
				const tier = getSubscriptionTier(versionNum);

				subs[tier - 1].badges.push({
					...base,
					title: i18n.t('channel.subscriber'),
					value: i18n.duration(versionNum),
					type: 'SUBSCRIPTIONS',
					tier
				});
			}
		});

	return response;
}

function badgeValue(badge: TwitchBadge, i18n: Translator): string | undefined {
	if (badge.setID === 'bits') return i18n.number(Number(badge.version));
	if (badge.setID === 'subscriber') return i18n.duration(Number(badge.version));
	return undefined;
}

export async function getTwitchGlobalBadges(i18n: Translator): Promise<Badges[]> {
	const source = '[Twitch] Global Badges';
	const badges = (
		await requestJson<{ badges?: TwitchBadge[] }>(source, `${API}/global_badges`, {
			headers: languageHeaders(i18n.locale)
		})
	)?.badges;

	if (!badges || badges.length === 0) {
		throw new ProviderError(source, 404);
	}

	return sortBadges(
		badges.map((badge) => ({
			id: badge.setID,
			title: badge.title,
			value: badgeValue(badge, i18n),
			version: badge.version,
			type: getType(badge.setID, true),
			description:
				badge.description?.trim()?.length > 0 && badge.setID !== 'subscriber'
					? badge.description
					: null,
			image: badge.image_url_4x,
			clickAction: badge.onClickAction,
			clickURL: badge.clickURL,
			provider: 'twitch'
		}))
	);
}

const flairImage = (owner: string, version: string, size: number): string =>
	`https://badge-flair-twitch-subs-aws.s3-us-west-2.amazonaws.com/${owner}/${version}/${size}x${size}.png`;

async function getTwitchFlair(
	version: string,
	channel: string | undefined,
	isId: boolean,
	i18n: Translator
): Promise<Badge> {
	if (!['2000', '3000'].includes(version)) {
		throw new ProviderError('[Twitch] Badge', 404);
	}

	const owner = channel ? await getTwitchUser(channel, isId) : twitchOwner;

	let flairOwner = 'default';
	if (channel && owner.id && (await exists(flairImage(owner.id, version, 18)))) {
		flairOwner = owner.id;
	}

	return {
		id: 'flair',
		name: i18n.t('common.flair'),
		provider: 'twitch',
		owner,
		images: [18, 36, 72].map((size) => flairImage(flairOwner, version, size)),
		description: null,
		version: `${version}/${owner.id}`,
		related: { total: 0, list: [] },
		setId: null,
		type: 'FLAIR',
		tier: Number(version) / 1000,
		global: flairOwner === 'default',
		source: channel ? `https://twitch.tv/subs/${owner.username}` : null,
		createdAt: null
	};
}

export async function getTwitchBadge(idCode: string, ctx: BadgeContext): Promise<Badge> {
	const source = '[Twitch] Badge';
	const { i18n, globals } = ctx;
	const [id, version, channel] = idCode.split('/');

	const isId = /^\d{1,10}$/.test(channel ?? version);
	const isUUID = /^[\da-fA-F]{8}-([\da-fA-F]{4}-){3}[\da-fA-F]{12}$/.test(id);

	if (id === 'flair') {
		return getTwitchFlair(version, channel, isId, i18n);
	}

	let owner: User | null = null;
	let isGlobal = false;
	let badge: Badges;
	let related: Badges[] = [];

	if (!channel && !version && isUUID) {
		const url = `https://static-cdn.jtvnw.net/badges/v1/${id}/3`;
		if (!(await exists(url))) {
			throw new ProviderError(source, 404);
		}

		const globalBadge = globals.find((b) => b.image.includes(id));

		if (globalBadge) {
			badge = globalBadge;
			isGlobal = true;
			owner = twitchOwner;
			related = globals.filter(
				(b) =>
					b.id === globalBadge.id &&
					b.version !== globalBadge.version &&
					b.provider === 'twitch'
			);
		} else {
			badge = {
				id,
				title: '',
				image: url,
				description: null,
				version: '',
				provider: 'twitch'
			};
		}
	} else if (!channel && !isUUID) {
		const globalData = findGlobalBadge(globals, id, version ?? '1', 'twitch');
		if (!globalData.badge) {
			throw new ProviderError(source, 404);
		}

		badge = globalData.badge;
		related = globalData.related;
		isGlobal = true;
		owner = twitchOwner;
	} else {
		const userData = (
			await requestJson<{ user?: TwitchUser }>(
				source,
				`${API}/get_badges/${isId ? 'id' : 'login'}/${encodeURIComponent(channel ?? version)}`,
				{ headers: languageHeaders(i18n.locale) }
			)
		)?.user;

		if (!userData?.broadcastBadges?.length) {
			throw new ProviderError(source, 404);
		}

		const badges = userData.broadcastBadges;
		const data = badges.find((b) =>
			isUUID ? b.image_url_4x.includes(id) : b.setID === id && b.version === version
		);

		if (!data) {
			throw new ProviderError(source, 404);
		}

		const tier = getSubscriptionTier(Number(data.version));

		badge = {
			id: data.setID,
			title: data.title,
			value: data.setID === 'bits' ? i18n.number(Number(data.version)) : undefined,
			version: `${data.version}/${userData.id}`,
			description: data.description,
			clickAction: data.onClickAction?.length ? data.onClickAction.toLowerCase() : null,
			clickURL: data.clickURL ?? null,
			image: data.image_url_4x,
			provider: 'twitch'
		};

		const relatedBadges = badges
			.filter(
				(b) =>
					b.setID === data.setID &&
					b.version !== data.version &&
					b.id !== data.id &&
					(b.setID !== 'subscriber' || getSubscriptionTier(Number(b.version)) === tier)
			)
			.map((b) => ({
				id: b.setID,
				title: b.title,
				value: badgeValue(b, i18n),
				version: `${b.version}/${userData.id}`,
				description: b.description,
				image: b.image_url_4x,
				provider: 'twitch'
			}));

		const relatedGlobal = findGlobalBadge(
			globals,
			data.setID,
			data.version,
			'twitch',
			true
		).related;

		related = [...sortBadges(relatedBadges), ...relatedGlobal];

		const userName = compareName(userData.login, userData.displayName);
		owner = {
			id: userData.id,
			avatar: userData.profileImageURL,
			source: `https://twitch.tv/${userName}`,
			platform: 'twitch',
			username: userName
		};
	}

	const badgeId = badge.image.match(UUID);
	const versionNum = Number(badge.version.split('/')[0]);

	return {
		id: badge.id,
		name: badge.id === 'subscriber' ? i18n.duration(versionNum, true) : badge.title,
		provider: 'twitch',
		owner,
		images: [1, 2, 3].map(
			(scale) => `https://static-cdn.jtvnw.net/badges/v1/${badgeId}/${scale}`
		),
		description: badge.description,
		cost: badge.id === 'bits' ? versionNum : undefined,
		version: badge.version ?? '1',
		clickAction: badge.clickAction,
		clickURL:
			badge.clickAction === 'subscribe'
				? `https://twitch.tv/subs/${owner?.username}`
				: badge.clickAction === 'GET_TURBO'
					? 'https://twitch.tv/turbo'
					: (badge.clickURL ?? null),
		related: { total: related.length, list: related },
		setId: null,
		global: isGlobal,
		tier: badge.id === 'subscriber' ? getSubscriptionTier(versionNum) : undefined,
		type: getType(badge.id, isGlobal),
		source:
			isGlobal || !owner
				? null
				: `https://twitch.tv/${badge.id === 'subscriber' ? 'subs/' : ''}${owner.username}`,
		createdAt: null
	};
}

interface PotatEmoteSearch {
	data?: { id: string; name: string; format: 'STATIC' | 'ANIMATED'; url: string }[];
	errors?: { message: string }[];
	pagination?: { cursor: string | null; hasNextPage: boolean };
}

export async function searchTwitchEmotes(
	options: EmoteSearchOptions,
	page: PageRequest
): Promise<SearchPage> {
	const source = '[Twitch] Search';
	const query = options.query.trim();
	if (!query) return { emotes: [], next: null };

	const url = new URL('https://api.potat.app/twitch/emotes/search');
	url.searchParams.set(options.exact ? 'matches' : 'includes', query);
	url.searchParams.set('case', 'false');
	url.searchParams.set('first', String(Math.min(page.count, 100)));
	if (options.format !== 'all') url.searchParams.set('format', options.format);
	if (page.cursor) url.searchParams.set('after', page.cursor);

	let res: Response;
	try {
		res = await request(url);
	} catch {
		throw new ProviderError(source, 503);
	}

	const body = (await res.json().catch(() => null)) as PotatEmoteSearch | null;

	if (res.status === 404 && body?.errors?.some((e) => /no emotes found/i.test(e.message))) {
		return { emotes: [], next: null };
	}
	if (!res.ok || !Array.isArray(body?.data)) {
		throw new ProviderError(source, res.ok ? 502 : res.status);
	}

	return {
		next: (body.pagination?.hasNextPage && body.pagination.cursor) || null,
		emotes: body.data.map((emote) => ({
			id: emote.id,
			name: emote.name,
			image: emoteImage(emote.id),
			owner: null,
			animated: emote.format === 'ANIMATED',
			createdAt: null,
			provider: 'twitch'
		}))
	};
}

export async function searchTwitchChannel(search: string, limit = 50): Promise<User[]> {
	const source = '[Twitch] Channels';
	const searchData = (
		await requestJson<{ searchUsers?: { edges?: { node: TwitchUser }[] } }>(
			source,
			`${API}/search_user/${encodeURIComponent(search)}?limit=${limit}`
		)
	)?.searchUsers?.edges;

	if (!searchData) {
		throw new ProviderError(source, 404);
	}

	return searchData.map(({ node: user }) => ({
		id: user.id,
		platform: 'twitch',
		avatar: user.profileImageURL,
		source: `https://twitch.tv/${user.login}`,
		username: compareName(user.login, user.displayName),
		followers: user.followers?.count ?? null
	}));
}
