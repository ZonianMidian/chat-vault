import type {
	CategoryInfo,
	ChannelData,
	Socials,
	Badges,
	Emotes,
	Emote,
	Badge,
	User
} from '#lib/types/common.ts';
import type { Category, KickEmotes, KickGlobals, KickUser, UserData } from '#lib/types/kick.ts';
import type { BadgeContext, EmoteContext } from './context';
import type { Translator } from '#lib/server/i18n.ts';

import { compareName, getFavicon, resizeImageUrl, sortBadges } from '#lib/utils/index.ts';
import { ProviderError, exists, requestJson } from '#lib/server/http.ts';
import DateData from '#lib/server/badges/data/dates.json';
import { findGlobalBadge } from './context';

const defaultOffline = 'https://kick.com/img/default-channel-banners/offline-banner.webp';

const getBanner = (id: number): string =>
	`https://kick.com/img/default-channel-banners/new-default-banner-${(id % 4) + 1}.webp`;

const getAvatar = (id: number): string =>
	`https://kick.com/img/default-profile-pictures/default-avatar-${(id % 6) + 1}.webp`;

const kickOwner: User = {
	id: '6843639',
	avatar: 'https://files.kick.com/images/user/6937907/profile_image/conversion/80a89cbd-7052-49cd-b710-16778899bd86-fullsize.webp',
	source: 'https://kick.com/Kick',
	username: 'Kick',
	platform: 'kick'
};

const socialConfig: Record<string, string> = {
	instagram: 'https://instagram.com/',
	twitter: 'https://twitter.com/',
	youtube: 'https://youtube.com/',
	discord: 'https://discord.gg/',
	tiktok: 'https://tiktok.com/@',
	facebook: 'https://facebook.com/'
};

interface Dates {
	badgeName: string | null;
	addedAt: string | null;
	removedAt: string | null;
}

const badgeFiles = Object.keys(
	import.meta.glob('/static/images/badge/kick/*.{svg,png}', {
		import: 'default',
		query: 'url',
		eager: true
	})
).map((path) => path.split('/').pop() ?? '');

const emoteImage = (id: string | number): string => `https://files.kick.com/emotes/${id}/fullsize`;
const subBadgeImage = (id: string | number): string =>
	`https://files.kick.com/channel_subscriber_badges/${id}/original`;

function channelEmotes(data: KickEmotes[]): KickEmotes[] {
	return data.filter((group) => group.emotes && group.user_id);
}

export async function getKickEmote(emoteId: string, ctx: EmoteContext): Promise<Emote> {
	const source = '[Kick] Emote';
	const [id, channel] = emoteId.split('/');

	let emote: Emotes;
	let owner: User | null = null;
	let subOnly = false;

	if (channel) {
		const data = await requestJson<KickEmotes[]>(
			source,
			`https://kick.com/emotes/${encodeURIComponent(channel)}`
		).catch(() => {
			throw new ProviderError(source, 404);
		});

		const userData = channelEmotes(data);
		const emoteData = userData
			.flatMap((group) => group.emotes)
			.find((item) => item.id.toString() === id);

		if (!emoteData) {
			throw new ProviderError(source, 404);
		}

		emote = {
			id: emoteData.id.toString(),
			name: emoteData.name,
			image: emoteImage(emoteData.id),
			type: emoteData.subscribers_only ? 'SUBSCRIPTIONS' : 'FOLLOWER',
			owner: userData[0].slug,
			provider: 'kick'
		};

		subOnly = emoteData.subscribers_only;

		const userName = compareName(userData[0].slug, userData[0].user.username);

		owner = {
			id: userData[0].user_id.toString(),
			avatar: userData[0].user.profile_pic ?? getAvatar(userData[0].user_id),
			source: `https://kick.com/${userName}`,
			username: userName,
			platform: 'kick'
		};
	} else if (ctx.global) {
		emote = ctx.global;
		owner = kickOwner;
	} else {
		if (!/^\d+$/.test(id) || !(await exists(emoteImage(id)))) {
			throw new ProviderError(source, 404);
		}

		emote = {
			id,
			name: '',
			image: emoteImage(id),
			type: 'CHANNEL',
			owner: null,
			provider: 'kick'
		};
	}

	return {
		id: emoteId.toLowerCase(),
		name: emote.name,
		provider: 'kick',
		tags: [],
		artist: null,
		owner,
		images: [emoteImage(id), emoteImage(id), emoteImage(id)],
		source: owner ? `https://kick.com/${owner.username}${subOnly ? '/subscribe' : ''}` : null,
		createdAt: null,
		approved: true,
		type: ctx.global ? 'GLOBALS' : (emote.type ?? 'CHANNEL'),
		public: true,
		animated: false,
		global: !!ctx.global,
		deleted: false,
		channels: {
			total: 0,
			list: []
		}
	};
}

export async function getKickGlobalEmotes(): Promise<Emotes[]> {
	const source = '[Kick] Global Emotes';
	const data = await requestJson<KickGlobals[]>(source, 'https://kick.com/emotes/kick');

	if (!Array.isArray(data)) {
		throw new ProviderError(source, 500);
	}

	return data.flatMap((item) =>
		(item.emotes || []).map((emote) => ({
			id: emote.id.toString(),
			name: emote.name,
			image: emoteImage(emote.id),
			owner: null,
			provider: 'kick'
		}))
	);
}

function getSocials(user: UserData): Socials[] {
	return Object.entries(socialConfig).flatMap(([name, baseUrl]) => {
		const handle = user[name as keyof UserData];
		if (typeof handle !== 'string' || handle.trim() === '') return [];

		try {
			const { url, icon } = getFavicon(`${baseUrl}${handle.trim()}`);
			return [{ title: handle.trim(), name, icon, url }];
		} catch {
			return [];
		}
	});
}

function getCategory(categories: Category[]): CategoryInfo | null {
	const category = categories?.[0];
	if (!category) return null;

	return {
		url: `https://kick.com/category/${category.slug}`,
		name: category.name,
		boxArt: category.banner?.url ?? null
	};
}

export async function getKickChannel(userLogin: string, i18n: Translator): Promise<ChannelData> {
	const source = '[Kick] Channel';
	const login = encodeURIComponent(userLogin);

	const [emotesData, data] = await Promise.all([
		requestJson<KickEmotes[]>(source, `https://kick.com/emotes/${login}`),
		requestJson<KickUser>(source, `https://kick.com/api/v1/channels/${login}`)
	]).catch(() => {
		throw new ProviderError(source, 404);
	});

	if (!emotesData || !data?.user) {
		throw new ProviderError(source, 500);
	}

	const emotesList = channelEmotes(emotesData).flatMap((group) => group.emotes);

	const mapEmotes = (subscribersOnly: boolean): Emotes[] =>
		emotesList
			.filter((emote) => emote.subscribers_only === subscribersOnly)
			.map((emote) => ({
				id: `${emote.id}/${data.slug}`,
				name: emote.name,
				image: emoteImage(emote.id),
				type: subscribersOnly ? 'SUBSCRIPTIONS' : 'FOLLOWER',
				owner: null,
				provider: 'kick'
			}));

	const getOffline = (url: string | undefined): string => {
		const id = url?.match(/([a-f0-9-]{36})-fullsize\.jpg$/i)?.[1];
		return id
			? `https://files.kick.com/images/channel/${data.id}/offline_banner/${id}`
			: defaultOffline;
	};

	const getPreview = (responsive: string | undefined): string =>
		responsive?.split('1280w,')[1]?.split(' ')[1] || defaultOffline;

	const offlineImage = data.offline_banner_image
		? getOffline(data.offline_banner_image.src)
		: defaultOffline;

	return {
		provider: 'kick',
		source: `https://kick.com/${data.slug}`,
		user: {
			id: data.user_id.toString(),
			color: '#666666',
			backgroundColor: '#000',
			createdAt: data.chatroom.created_at,
			bio: data.user.bio?.length ? data.user.bio : null,
			username: data.user.username,
			slug: data.slug,
			followers: data.followersCount,
			roles: {
				isAffiliate: data.is_affiliate && !data.verified,
				isPartner: !!data.verified,
				isStaff: false
			},
			socials: getSocials(data.user),
			badge: null,
			images: {
				avatar: data.user.profile_pic ?? getAvatar(data.id),
				banner: data.banner_image ? data.banner_image.url : getBanner(data.id)
			},
			offline: {
				title: data.previous_livestreams?.[0]?.session_title || null,
				image: offlineImage
			},
			stream: data.livestream && {
				title: data.livestream.session_title,
				language: data.livestream.lang_iso.toUpperCase(),
				isMature: data.livestream.is_mature,
				createdAt: (data.livestream.created_at.replace(' ', 'T') + 'Z') as unknown as Date,
				viewers: data.livestream.viewer_count,
				category: getCategory(data.recent_categories),
				preview: getPreview(data.livestream.thumbnail?.responsive)
			}
		},
		content: {
			follower: {
				emotes: mapEmotes(false),
				badges: []
			},
			sub: {
				title: null,
				emotes: mapEmotes(true),
				badges: (data.subscriber_badges ?? []).map((badge) => ({
					id: `subscriber/${badge.months}`,
					title: i18n.t('channel.subscriber'),
					value: i18n.duration(badge.months),
					description: null,
					version: data.slug,
					type: 'SUBSCRIPTIONS',
					image: resizeImageUrl(subBadgeImage(badge.id), 72),
					provider: 'kick'
				}))
			},
			subT2: null,
			subT3: null,
			bits: { emotes: [], badges: [] },
			special: { emotes: [], badges: [] },
			campaign: { emotes: [], badges: [] }
		}
	};
}

export function getKickGlobalBadges(i18n: Translator): Badges[] {
	const dates = DateData.kick as Record<string, Dates>;

	return sortBadges(
		badgeFiles.map((file) => {
			const [id, version] = file.replace(/\.(svg|png)$/, '').split('~');

			return {
				id,
				title:
					dates[id]?.badgeName ||
					i18n.t(`badge.kick.${id}`, { count: version || '0' }, id),
				type: id === 'subscriber' ? 'SUBSCRIPTIONS' : 'GLOBALS',
				version: version || '1',
				description: null,
				image: `/images/badge/kick/${file}`,
				provider: 'kick'
			};
		})
	);
}

export async function getKickBadge(badgeId: string, ctx: BadgeContext): Promise<Badge> {
	const source = '[Kick] Badge';
	const { i18n, globals } = ctx;
	const [id, version, channel] = badgeId.split('/');

	let owner: User | null = null;
	let isGlobal = false;
	let badge: Badges;
	let images: string[];
	let related: Badges[] = [];

	if (!channel && !version && /^\d+$/.test(id)) {
		if (!(await exists(subBadgeImage(id)))) {
			throw new ProviderError(source, 404);
		}

		badge = {
			id,
			title: '',
			image: resizeImageUrl(subBadgeImage(id), 72),
			description: null,
			version: '',
			type: 'SUBSCRIPTIONS',
			provider: 'kick'
		};

		images = Array(3).fill(subBadgeImage(id));
	} else if (!channel && (!version || /^\d{1,5}$/.test(version))) {
		const globalData = findGlobalBadge(globals, id, version ?? '1', 'kick');
		if (!globalData.badge) {
			throw new ProviderError(source, 404);
		}

		const isSubscriber = globalData.badge.id === 'subscriber';

		badge = {
			...globalData.badge,
			type: isSubscriber ? 'SUBSCRIPTIONS' : 'GLOBALS',
			description: isSubscriber ? null : globalData.badge.title
		};
		related = globalData.related;
		isGlobal = true;
		owner = kickOwner;
		images = Array(3).fill(globalData.badge.image);
	} else {
		const data = await requestJson<KickUser>(
			source,
			`https://kick.com/api/v1/channels/${encodeURIComponent(channel ?? version)}`
		).catch(() => {
			throw new ProviderError(source, 404);
		});

		if (!data?.user) {
			throw new ProviderError(source, 404);
		}

		const allBadges = data.subscriber_badges;
		if (!Array.isArray(allBadges)) {
			throw new ProviderError(source, 500);
		}

		const isId = /^\d+$/.test(id);
		const badgeData = allBadges.find((item) =>
			isId ? item.id.toString() === id : item.months.toString() === version
		);
		if (!badgeData) {
			throw new ProviderError(source, 404);
		}

		badge = {
			id: 'subscriber',
			title: i18n.duration(badgeData.months, true),
			description: null,
			version: `${badgeData.months}/${data.slug}`,
			type: 'SUBSCRIPTIONS',
			image: subBadgeImage(badgeData.id),
			provider: 'kick'
		};

		const userName = compareName(data.slug, data.user.username);
		owner = {
			id: data.id.toString(),
			avatar: data.user.profile_pic ?? getAvatar(data.id),
			source: `https://kick.com/${userName}`,
			username: userName,
			platform: 'kick'
		};

		const relatedBadges = allBadges
			.filter((item) => item.id !== badgeData.id)
			.map((item) => ({
				id: 'subscriber',
				title: i18n.t('channel.subscriber'),
				value: i18n.duration(item.months),
				description: null,
				version: `${item.months}/${data.slug}`,
				type: 'SUBSCRIPTIONS',
				image: subBadgeImage(item.id),
				provider: 'kick'
			}));

		const relatedGlobal = findGlobalBadge(
			globals,
			'subscriber',
			badgeData.months.toString(),
			'kick',
			true
		).related;

		related = [...relatedBadges, ...relatedGlobal];
		images = Array(3).fill(subBadgeImage(badgeData.id));
	}

	return {
		id: badge.id,
		name: badge.title,
		provider: 'kick',
		owner,
		images,
		description: badge.description,
		version: badge.version,
		related: { total: related.length, list: related },
		setId: null,
		type: badge.type,
		global: isGlobal,
		source: isGlobal || !owner ? null : `https://kick.com/${owner.username}/subscribe`,
		createdAt: null
	};
}

export async function searchKickChannel(search: string, limit = 50): Promise<User[]> {
	const source = '[Kick] Channels';
	const data = (
		await requestJson<{ channels?: KickUser[] }>(
			source,
			`https://kick.com/api/search?searched_word=${encodeURIComponent(search)}`
		)
	)?.channels;

	if (!data) {
		throw new ProviderError(source, 404);
	}

	return data.slice(0, limit).map((user) => ({
		id: user.user_id.toString(),
		avatar: user.user.profilePic ?? getAvatar(user.user_id),
		source: `https://kick.com/${user.slug}`,
		username: compareName(user.slug, user.user.username),
		platform: 'kick',
		followers: user.followersCount ?? null
	}));
}
