import type {
	ChannelData,
	Emote,
	Badges,
	Emotes,
	CategoryInfo,
	Socials,
	User,
	Badge
} from '$lib/types/common';
import type { Category, KickEmotes, KickGlobals, KickUser, UserData } from '$lib/types/kick';

import {
	findGlobalEmote,
	findGlobalBadge,
	formatDuration,
	rezizeImageUrl,
	socialConfig,
	compareName,
	sortBadges,
	$format,
	getFavicon
} from '$lib/utils';

const defaultAvatar = 'https://kick.com/img/default-profile-pictures/default2.jpeg';
const kickAvatar =
	'https://files.kick.com/images/user/6937907/profile_image/conversion/08dd8362-0244-4b28-955c-09909fbab507-fullsize.webp';

export async function getKickEmote(emoteId: string): Promise<Emote> {
	let [id, channel] = emoteId.split('/');

	let badge: Emotes | null = null;
	let owner: User | null = null;
	let isGlobal = false;
	let subOnly = false;

	if (channel) {
		const url = `https://kick.com/emotes/${channel}`;

		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`[Kick] Emote | 404: ${$format('status.404')}`);
		}

		const data: KickEmotes[] = await res.json();
		const userData = data.filter((channel) => channel.emotes && channel.user_id);
		const emotesList = userData.flatMap((emote) => emote.emotes);

		const emoteData = emotesList.find((emote) => emote.id.toString() === id);
		if (!emoteData) {
			throw new Error(`[Kick] Emote | 404: ${$format('status.404')}`);
		}

		badge = {
			id: emoteData.id.toString(),
			name: emoteData.name,
			image: `https://files.kick.com/emotes/${emoteData.id}/fullsize`,
			owner: userData[0].slug,
			provider: 'kick'
		};

		subOnly = emoteData.subscribers_only;

		const userName = compareName(userData[0].slug, userData[0].user.username);

		owner = {
			id: userData[0].user_id.toString(),
			avatar: userData[0].user.profile_pic ?? defaultAvatar,
			source: `https://kick.com/${userName}`,
			username: userName,
			platform: 'kick'
		};
	} else {
		badge = await findGlobalEmote(id, 'kick');

		if (!badge) {
			const url = rezizeImageUrl(`https://files.kick.com/emotes/${id}/fullsize`, 70);

			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`[Kick] Emote | 404: ${$format('status.404')}`);
			}

			badge = {
				id: id.toString(),
				name: '',
				image: `https://files.kick.com/emotes/${id}/fullsize`,
				owner: null,
				provider: 'kick'
			};
		} else {
			isGlobal = true;

			owner = {
				id: '6843639',
				avatar: kickAvatar,
				source: 'https://kick.com/Kick',
				username: 'Kick',
				platform: 'kick'
			};
		}
	}

	return {
		id: emoteId.toString().toLowerCase(),
		name: badge.name,
		provider: 'kick',
		tags: [],
		artist: null,
		owner,
		images: [
			`https://files.kick.com/emotes/${id}/fullsize`,
			`https://files.kick.com/emotes/${id}/fullsize`,
			`https://files.kick.com/emotes/${id}/fullsize`
		],
		source: owner ? `https://kick.com/${owner.username}${subOnly ? '/subscribe' : ''}` : null,
		createdAt: null,
		approved: true,
		type: isGlobal ? 'GLOBALS' : 'CHANNEL',
		public: true,
		animated: false,
		global: !!isGlobal,
		deleted: false,
		channels: {
			total: 0,
			list: []
		}
	};
}

export async function getKickGlobalEmotes(): Promise<Emotes[]> {
	const url = 'https://kick.com/emotes/kick';

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`[Kick] Global Emotes | 404: ${$format('status.404')}`);
	}

	const data: KickGlobals[] = await res.json();

	if (!data || !Array.isArray(data)) {
		throw new Error(`[Kick] Global Emotes | 500: ${$format('status.500')}`);
	}

	return data.flatMap((item) =>
		(item.emotes || []).map((emote) => ({
			id: emote.id.toString(),
			name: emote.name,
			image: `https://files.kick.com/emotes/${emote.id}/fullsize`,
			owner: null,
			provider: 'kick'
		}))
	);
}

export async function getKickChannel(userLogin: string): Promise<ChannelData> {
	const [emotes, channel] = await Promise.all([
		fetch(`https://kick.com/emotes/${userLogin}`),
		fetch(`https://kick.com/api/v1/channels/${userLogin}`)
	]);

	if (!emotes.ok || !channel.ok) {
		throw new Error(`[Kick] Channel | 404: ${$format('status.404')}`);
	}

	const emotesData: KickEmotes[] = await emotes.json();
	const data: KickUser = await channel.json();

	if (!emotesData || !data) {
		throw new Error(`[Kick] Channel | 500: ${$format('status.500')}`);
	}

	const emotesList = emotesData
		.filter((channel) => channel.emotes && channel.user_id)
		.flatMap((emote) => emote.emotes);

	const getBanner = (id: number): string => {
		const bucket = (id % 4) + 1;

		const n = Math.min(Math.max(bucket, 1), 4);
		return `https://kick.com/img/default-channel-banners/default-banner-${n}.webp`;
	};

	const getOffline = (url: string | undefined): string => {
		const id = url?.split('/conversion/')[1].split('-')[0];
		if (!url || !id) return 'https://kick.com/img/default-channel-banners/offline.webp';
		return `https://files.kick.com/images/channel/${data.id}/offline_banner/${id}`;
	};

	const getCategory = (category: Category[]): CategoryInfo | null => {
		const data = category[0];
		if (!data) return null;

		return {
			url: `https://kick.com/category/${data.slug}`,
			name: data.name,
			boxArt: data.banner?.url ?? null
		};
	};

	const getPreview = (url: string | undefined): string => {
		const previewLink = url?.split('1280w,')[1].split(' ')[1];

		if (!url || !previewLink)
			return 'https://kick.com/img/default-channel-banners/offline.webp';
		return previewLink;
	};

	const getSocials = (user: UserData): Socials[] => {
		return Object.keys(socialConfig)
			.filter((key) => {
				const v = user[key as keyof UserData];
				return typeof v === 'string' && v.trim() !== '';
			})
			.map<Socials>((key) => {
				const handle = (user[key as keyof UserData] as string).trim();
				const baseUrl = socialConfig[key];

				const { url, icon } = getFavicon(`${baseUrl}${handle}`);

				return {
					title: handle,
					name: key,
					icon,
					url
				};
			});
	};

	const userName = compareName(data.slug, data.user.username);

	return {
		provider: 'kick',
		source: `https://kick.com/${userName}`,
		user: {
			id: data.user_id.toString(),
			color: '#666666',
			backgroundColor: '#000',
			createdAt: data.chatroom.created_at,
			bio: data.user.bio?.length ? data.user.bio : null,
			username: userName,
			followers: data.followersCount,
			roles: {
				isAffiliate: data.is_affiliate && !data.verified,
				isPartner: !!data.verified,
				isStaff: false
			},
			socials: getSocials(data.user),
			badge: null,
			images: {
				avatar: data.user.profile_pic ?? defaultAvatar,
				banner: data.banner_image ? data.banner_image.url : getBanner(data.id),
				offline: data.offline_banner_image
					? getOffline(data.offline_banner_image.src)
					: 'https://kick.com/img/default-channel-banners/offline.webp'
			},
			stream: data.livestream && {
				title: data.livestream.session_title,
				language: data.livestream.lang_iso.toUpperCase(),
				isMature: data.livestream.is_mature,
				createdAt: (data.livestream.created_at.replace(' ', 'T') + 'Z') as unknown as Date,
				viewers: data.livestream.viewer_count,
				category: getCategory(data.recent_categories),
				preview: getPreview(data.livestream.thumbnail.responsive)
			}
		},
		content: {
			follower: {
				emotes: emotesList
					.filter((emote) => emote.subscribers_only === false)
					.map((emote) => ({
						id: `${emote.id}/${data.slug}`,
						name: emote.name,
						image: `https://files.kick.com/emotes/${emote.id}/fullsize`,
						owner: null,
						provider: 'kick'
					})),
				badges: []
			},
			sub: {
				title: null,
				emotes: emotesList
					.filter((emote) => emote.subscribers_only === true)
					.map((emote) => ({
						id: `${emote.id}/${data.slug}`,
						name: emote.name,
						image: `https://files.kick.com/emotes/${emote.id}/fullsize`,
						owner: null,
						provider: 'kick'
					})),
				badges: data.subscriber_badges.map((badge) => ({
					id: `subscriber/${badge.months}`,
					title: $format('channel.subscriber'),
					value: formatDuration(badge.months),
					description: null,
					version: data.slug,
					type: 'SUBSCRIPTIONS',
					image: rezizeImageUrl(
						`https://files.kick.com/channel_subscriber_badges/${badge.id}/original`,
						72
					),
					provider: 'kick'
				}))
			},
			subT2: null,
			subT3: null,
			bits: {
				emotes: [],
				badges: []
			}
		}
	};
}

export async function getKickGlobalBadges(): Promise<Badges[]> {
	try {
		const svgModules = import.meta.glob('/static/images/badge/kick/*.svg', {
			import: 'default',
			query: 'url',
			eager: true
		});

		const badges: Badges[] = [];

		for (const [path, _] of Object.entries(svgModules)) {
			const fileName = path.split('/').pop()?.replace('.svg', '') || '';
			const [id, version] = fileName.split('_');

			const imagePath = `/images/badge/kick/${fileName}.svg`;

			badges.push({
				id,
				title: $format(`badge.kick.${id}`, { values: { count: version || '0' } }),
				image: imagePath,
				description: null,
				version: version || '1',
				provider: 'kick'
			});
		}

		return sortBadges(badges);
	} catch (error) {
		throw new Error(`[Kick] Global Badges | 500: ${$format('status.500')}`);
	}
}

export async function getKickBadge(badgeId: string): Promise<Badge> {
	let [id, version, channel] = badgeId.split('/');

	let owner: User | null = null;
	let isGlobal = false;
	let badge: Badges;
	let images = [];
	let related = {
		total: 0,
		list: [] as Badges[]
	};

	if (!channel && !version && /^\d+$/.test(id)) {
		const url = rezizeImageUrl(
			`https://files.kick.com/channel_subscriber_badges/${id}/original`,
			72
		);
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`[Kick] Badge | 404: ${$format('status.404')}`);
		}

		badge = {
			id,
			title: '',
			image: url,
			description: null,
			version: '',
			type: 'SUBSCRIPTIONS',
			provider: 'kick'
		};

		images = [
			`https://files.kick.com/channel_subscriber_badges/${id}/original`,
			`https://files.kick.com/channel_subscriber_badges/${id}/original`,
			`https://files.kick.com/channel_subscriber_badges/${id}/original`
		];
	} else if (!channel && (/^\d{1,5}$/.test(version) || !version)) {
		const globalData = await findGlobalBadge(id, version ?? '1', 'kick');
		if (!globalData.badge) {
			throw new Error(`[Kick] Badge | 404: ${$format('status.404')}`);
		}

		badge = {
			...globalData.badge,
			type: globalData.badge.id === 'subscriber' ? 'SUBSCRIPTIONS' : 'GLOBALS',
			description: globalData.badge.id === 'subscriber' ? null : globalData.badge.title
		};
		isGlobal = true;
		related = {
			total: globalData.related.length,
			list: globalData.related
		};

		owner = {
			id: '6843639',
			avatar: kickAvatar,
			source: 'https://kick.com/Kick',
			username: 'Kick',
			platform: 'kick'
		};

		images = [globalData.badge.image, globalData.badge.image, globalData.badge.image];
	} else {
		const url = `https://kick.com/api/v1/channels/${channel ?? version}`;
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`[Kick] Badge | 404: ${$format('status.404')}`);
		}

		const data: KickUser = await res.json();
		if (!data) {
			throw new Error(`[Kick] Badge | 404: ${$format('status.404')}`);
		}

		const allBadges = data.subscriber_badges;
		if (!allBadges || !Array.isArray(allBadges)) {
			throw new Error(`[Kick] Badge | 500: ${$format('status.500')}`);
		}

		const userName = compareName(data.slug, data.user.username);
		const isId = /^\d+$/.test(id);

		const badgeData = allBadges.find((badge) =>
			isId ? badge.id.toString() === id : badge.months.toString() === version
		);
		if (!badgeData) {
			throw new Error(`[Kick] Badge | 404: ${$format('status.404')}`);
		}

		badge = {
			id: 'subscriber',
			title: formatDuration(badgeData.months, true),
			description: null,
			version: `${badgeData.months.toString()}/${data.slug}`,
			type: 'SUBSCRIPTIONS',
			image: `https://files.kick.com/channel_subscriber_badges/${id}/original`,
			provider: 'kick'
		};

		owner = {
			id: data.id.toString(),
			avatar: data.user.profile_pic ?? defaultAvatar,
			source: `https://kick.com/${userName}`,
			username: userName,
			platform: 'kick'
		};

		const { related: relatedGlobal } = await findGlobalBadge(
			'subscriber',
			badgeData.months.toString(),
			'kick',
			true
		);
		const badges = allBadges.filter((badge) => badge.id !== badgeData.id);

		const relatedBadges = badges.map((badge) => ({
			id: 'subscriber',
			title: $format('channel.subscriber'),
			value: formatDuration(badge.months),
			description: null,
			version: `${badge.months.toString()}/${data.slug}`,
			type: 'SUBSCRIPTIONS',
			image: `https://files.kick.com/channel_subscriber_badges/${badge.id}/original`,
			provider: 'kick'
		}));

		related = {
			total: badges.length + relatedGlobal.length,
			list: [...relatedBadges, ...relatedGlobal]
		};

		images = [
			`https://files.kick.com/channel_subscriber_badges/${badgeData.id}/original`,
			`https://files.kick.com/channel_subscriber_badges/${badgeData.id}/original`,
			`https://files.kick.com/channel_subscriber_badges/${badgeData.id}/original`
		];
	}

	return {
		id: badge.id,
		name: badge.title,
		provider: 'kick',
		owner,
		images,
		description: badge.description,
		version: badge.version,
		related,
		setId: null,
		type: badge.type,
		global: isGlobal,
		source: isGlobal || !owner ? null : `https://kick.com/${owner?.username}/subscribe`,
		createdAt: null
	};
}

export async function searchKickChannel(search: string, limit = 50): Promise<User[]> {
	const url = `https://kick.com/api/search?searched_word=${encodeURIComponent(search)}`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`[Kick] Channels | 404: ${$format('status.404')}`);
	}

	const data: KickUser[] = (await res.json())?.channels;
	if (!data) {
		throw new Error(`[Kick] Channels | 404: ${$format('status.404')}`);
	}

	return data.slice(0, limit).map((user) => ({
		id: user.user_id.toString(),
		avatar: user.user.profilePic ?? defaultAvatar,
		source: `https://kick.com/${user.slug}`,
		username: compareName(user.slug, user.user.username),
		platform: 'kick'
	}));
}
