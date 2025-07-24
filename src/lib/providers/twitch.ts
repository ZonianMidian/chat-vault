import type {
	ChannelData,
	Socials,
	Badges,
	Emotes,
	Emote,
	Badge,
	User,
	Set
} from '$lib/types/common';
import type {
	TwitchEmote,
	SocialMedia,
	TwitchBadge,
	TwitchUser,
	TwitchSet,
	GQLEmote
} from '$lib/types/twitch';

import { getLocaleFromNavigator } from 'svelte-i18n';
import ImageData from '$lib/emotes/data/images.json';
import {
	findEmoteOrigin,
	findGlobalBadge,
	formatDuration,
	generateString,
	getCheerName,
	compareName,
	sortBadges,
	$number,
	$format,
	UUID,
	getFavicon
} from '$lib/utils';
import { fetchGlobalBadges } from '$lib/badges/fetchGlobals';

export async function getTwitchEmote(emoteId: string): Promise<Emote> {
	const url = `https://api.potat.app/twitch/emotes?id=${encodeURIComponent(emoteId)}`;

	const res = await fetch(url);
	if (!res.ok) {
		const message = res.status === 500 ? $format('error.500') : res.statusText;
		throw new Error(`[Twitch] Emote | ${res.status}: ${message}`);
	}

	const data: TwitchEmote = (await res.json())?.data?.[0];
	if (!data) {
		throw new Error(`[Twitch] Emote | 400: ${$format('error.404')}`);
	}

	let userName;
	let userId;
	if (data.emoteSetID === '0') {
		userName = 'Twitch';
		userId = '12826';
	} else {
		userName = compareName(data.channelLogin ?? null, data.channelName ?? null);
		userId = data?.channelID;
	}

	const matchedItem = await findEmoteOrigin(emoteId, 'twitch');

	let images =
		(ImageData as Record<string, Record<string, string[]>>).twitch?.[emoteId] ??
		(matchedItem
			? matchedItem.url.includes('i.ivr.fi')
				? [1, 2, 3].map((n) => matchedItem.url.replace('_3x.', `_${n}x.`))
				: matchedItem.url.includes('i.imgur.com')
					? [matchedItem.url]
					: null
			: null);

	let altImage: string | null = null;
	if (emoteId.match(/_[A-Z]{2}$/)) {
		const baseEmoteId = emoteId.slice(0, -3);
		const originalEmote = await findEmoteOrigin(baseEmoteId, 'twitch');
		if (originalEmote) {
			altImage = originalEmote.url;
		}
	}

	const artist = data?.artist ? compareName(data.artist.login, data.artist.displayName) : null;

	return {
		id: emoteId,
		name: data?.emoteCode,
		provider: 'twitch',
		tags: [],
		artist:
			data?.artist && artist
				? {
						id: data.artist.id,
						avatar: `https://cdn.frankerfacez.com/avatar/twitch/${data.artist.id}`,
						source: `https://twitch.tv/${artist}`,
						username: artist,
						platform: 'twitch'
					}
				: null,
		owner: userId
			? {
					id: userId,
					avatar: `https://cdn.frankerfacez.com/avatar/twitch/${userId}`,
					source: `https://twitch.tv/${userName}`,
					platform: 'twitch',
					username: userName ?? ''
				}
			: null,
		images: images ?? [
			`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/1.0`,
			`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`,
			`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`
		],
		altImage,
		setId: data?.emoteSetID,
		source: `https://twitch.tv/${data.emoteType === 'SUBSCRIPTIONS' ? 'subs/' : ''}${userName}`,
		createdAt: null,
		approved: true,
		type: data?.emoteType ?? null,
		public: data?.emoteState == 'ACTIVE' ? true : false,
		animated: data?.emoteAssetType == 'ANIMATED' ? true : false,
		channels: {
			total: 0,
			list: []
		}
	};
}

export async function getTwitchGlobalEmotes(): Promise<Emotes[]> {
	const set = await getTwitchSet('0');
	if (!set) {
		throw new Error(`[Twitch] Global Emotes | 404: ${$format('error.404')}`);
	}

	return set.emotes.map((emote) => ({
		id: emote.id,
		name: emote.name,
		image: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
		owner: emote.owner,
		provider: 'twitch'
	}));
}

export async function getTwitchSet(setId: string): Promise<Set> {
	const url = `https://api.ivr.fi/v2/twitch/emotes/sets?set_id=${setId}`;
	const res = await fetch(url);
	if (!res.ok) {
		const message = res.status === 500 ? $format('error.500') : res.statusText;
		throw new Error(`[Twitch] Set | ${res.status}: ${message}`);
	}

	const data: TwitchSet[] = await res.json();

	if (!data || data.length === 0) {
		throw new Error(`[Twitch] Set | 404: ${$format('error.404')}`);
	}

	const set = data[0];
	const userName = set.channelID ? compareName(set.channelLogin, set.channelName) : 'Twitch';
	const subtitle =
		(!set.channelID && $format('set.global')) ||
		(set.tier && $format('set.tier', { values: { tier: set.tier } })) ||
		(set.emoteList?.[0]?.type === 'FOLLOWER' && $format('set.follower')) ||
		(set.emoteList?.[0]?.type === 'BITS_BADGE_TIERS' && $format('set.bits')) ||
		null;

	return {
		id: setId,
		name: $format('set.title', { values: { user: userName } }),
		subtitle,
		tags: [],
		source: `https://twitch.tv/${set.tier ? 'subs/' : ''}${userName}`,
		provider: 'twitch',
		owner: {
			id: set.channelID ?? '12826',
			username: userName,
			avatar: `https://cdn.frankerfacez.com/avatar/twitch/${set.channelID ?? '12826'}`,
			source: `https://twitch.tv/${userName}`,
			platform: 'twitch'
		},
		emotes: set.emoteList.map((emote) => ({
			id: emote.id,
			name: emote.code,
			image: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
			owner: emote.artist ? compareName(emote.artist.login, emote.artist.displayName) : null,
			provider: 'twitch'
		}))
	};
}

export async function getTwitchUser(userLogin: string): Promise<User> {
	const url = `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(userLogin)}`;

	const res = await fetch(url);
	if (!res.ok) {
		const message = res.status === 500 ? $format('error.500') : res.statusText;
		throw new Error(`[Twitch] User | ${res.status}: ${message}`);
	}

	const data: User = (await res.json())?.[0];
	if (!data) {
		throw new Error(`[Twitch] User | 404: ${$format('error.404')}`);
	}

	return data;
}

export async function getTwitchChannel(userLogin: string): Promise<ChannelData> {
	const url = `https://api.spanix.team/get_info/${userLogin}`;
	const res = await fetch(url);
	if (!res.ok)
		throw new Error(
			`[Twitch] Channel | ${res.status}: ${res.status === 500 ? $format('error.500') : res.statusText}`
		);
	const data: TwitchUser = (await res.json()).user;
	if (!data) throw new Error(`[Twitch] Channel | 404: ${$format('error.404')}`);

	const mapEmotes = (list: GQLEmote[]): Emotes[] =>
		list?.map((e) => ({
			id: e.id,
			name: e.code,
			image: `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/3.0`,
			owner: e.artist ? compareName(e.artist.login, e.artist.displayName) : null,
			provider: 'twitch',
			bitsCost: e.bits?.cost ?? undefined
		}));

	const { channel, subEmotes, cheer, broadcastBadges } = data;
	const { localEmoteSets } = data.channel;

	const followerEmotes = localEmoteSets?.[0]?.localEmotes ?? [];
	const bitsEmotes = cheer?.badgeTierEmotes ?? [];

	const subs = Array.from({ length: 3 }, (_, i) => {
		const tier = subEmotes?.[i];

		return {
			title: tier?.displayName ?? '',
			emotes: mapEmotes(tier?.emotes) ?? [],
			flair: i > 0 ? channel?.creatorBadgeFlair?.assets?.[i - 1]?.image_url_4x : undefined,
			badges: [] as Badges[]
		};
	});

	const socials = (list: SocialMedia[]): Socials[] =>
		list.map(({ url, name, title }) => {
			let { url: cleanUrl, icon } = getFavicon(url);

			return {
				name,
				title,
				url: cleanUrl,
				icon
			};
		});

	const banner = (username: string, color: string | null): string => {
		let text = '';
		while (text.length < 112) {
			text += (text ? ' ' : '') + username;
		}

		const chunks = [text.slice(0), text.slice(4), text.slice(2)];

		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" height="200">
			<rect width="100%" height="100%" fill="${color ?? '#cba6f7'}"/>
			<text x="15" y="27%" fill="#fff" font-size="4rem" font-weight="600" opacity=".1" font-family="Roobert,Helvetica Neue,Helvetica,Arial,sans-serif">
    			${chunks[0]}
  			</text>
			<text x="5" y="60%" fill="#fff" font-size="4rem" font-weight="600" opacity=".1" font-family="Roobert,Helvetica Neue,Helvetica,Arial,sans-serif">
    			${chunks[1]}
  			</text>
			<text y="93%" fill="#fff" font-size="4rem" font-weight="600" opacity=".1" font-family="Roobert,Helvetica Neue,Helvetica,Arial,sans-serif">
    			${chunks[2]}
  			</text></svg>
		`.trim();

		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	};

	const userName = compareName(data.login, data.displayName);

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
			followers: data.followers.count,
			roles: data.roles,
			socials: socials(data.channel.socialMedias),
			badge: data.selectedBadge && {
				id: data.selectedBadge.setID,
				title: data.selectedBadge.title,
				version: data.selectedBadge.version,
				image: data.selectedBadge.image_url_2x
			},
			images: {
				avatar: data.profileImageURL,
				banner: data.bannerImageURL ?? banner(userLogin, data.primaryColorHex),
				offline: data.offlineImageURL
			},
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
				badges: []
			},
			bits: {
				emotes: mapEmotes(bitsEmotes),
				badges: [] as Badges[]
			},
			sub: subs[0],
			subT2: subs[1],
			subT3: subs[2]
		}
	};

	broadcastBadges
		.sort((a, b) => Number(a.version) - Number(b.version))
		.forEach((badge) => {
			if (badge.setID === 'bits') {
				response.content.bits.badges.push({
					id: badge.setID,
					title: getCheerName(badge.title),
					value: $number(Number(badge.version)),
					version: `${badge.version}/${data.login}`,
					description: badge.description,
					image: badge.image_url_4x,
					provider: 'twitch'
				});
			} else if (badge.setID === 'subscriber') {
				const versionNum = Number(badge.version);
				const tier = versionNum >= 3000 ? 3 : versionNum >= 2000 ? 2 : 1;
				const months = tier > 1 ? versionNum - tier * 1000 : versionNum;
				const target =
					tier === 1
						? response.content.sub
						: tier === 2
							? response.content.subT2
							: response.content.subT3;
				target.badges.push({
					id: badge.setID,
					title: $format('channel.subscriber'),
					value: formatDuration(months),
					version: `${badge.version}/${data.login}`,
					description: badge.description,
					image: badge.image_url_4x,
					provider: 'twitch'
				});
			}
		});

	return response;
}

export async function getTwitchGlobalBadges(): Promise<Badges[]> {
	const query = `query GlobalBadges {
    	badges {
    	    id
    	    title
    	    setID
    	    version
    	    clickURL
    	    description
    	    onClickAction
    	    image_url_1x: imageURL(size: NORMAL)
    	    image_url_2x: imageURL(size: DOUBLE)
    	    image_url_4x: imageURL(size: QUADRUPLE)
    	}
	}`;

	const request = await fetch(`https://gql.twitch.tv/gql`, {
		credentials: 'omit',
		method: 'POST',
		headers: {
			'Accept-Language': `${getLocaleFromNavigator() || 'en-US'};q=0.9`,
			'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
		},
		body: JSON.stringify({ query })
	});

	if (!request.ok) {
		const message = request.status === 500 ? $format('error.500') : request.statusText;
		throw new Error(`[Twitch] Global Badges | ${request.status}: ${message}`);
	}

	const badges: TwitchBadge[] = (await request.json())?.data?.badges;
	if (!badges || badges.length === 0) {
		throw new Error(`[Twitch] Global Badges | 404: ${$format('error.404')}`);
	}

	return sortBadges(
		badges.map((badge) => ({
			id: badge.setID,
			title: badge.title,
			value:
				badge.setID === 'bits'
					? $number(Number(badge.version))
					: badge.setID === 'subscriber'
						? formatDuration(Number(badge.version))
						: undefined,
			version: badge.version,
			description: badge.description?.trim()?.length > 0 ? badge.description : null,
			image: badge.image_url_4x,
			provider: 'twitch'
		}))
	);
}

export async function getTwitchBadge(idCode: string): Promise<Badge> {
	let [id, version, channel] = idCode.split('/');

	let owner: User | null = null;
	let isGlobal = false;
	let badge: Badges;
	let related = {
		total: 0,
		list: [] as Badges[]
	};

	const isId = UUID.test(id);

	if (!channel && !version && isId) {
		const url = `https://static-cdn.jtvnw.net/badges/v1/${id}/3`;
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`[Twitch] Badge | 404: ${$format('error.404')}`);
		}

		const data: Badges[] = await fetchGlobalBadges('all');
		const globalBadge = data.find((b) => b.image.includes(id));

		if (globalBadge) {
			badge = globalBadge;
			isGlobal = true;

			const relatedBadges = data.filter((b) => b.id === globalBadge.id);
			related = {
				total: relatedBadges.length,
				list: relatedBadges
			};

			owner = {
				id: '12826',
				avatar: 'https://cdn.frankerfacez.com/avatar/twitch/12826',
				source: `https://twitch.tv/Twitch`,
				platform: 'twitch',
				username: 'Twitch'
			};
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
	} else if (!channel && !isId) {
		const globalData = await findGlobalBadge(id, version ?? '1', 'twitch');
		if (!globalData.badge) {
			throw new Error(`[Twitch] Badge | 404: ${$format('error.404')}`);
		}

		badge = globalData.badge;
		isGlobal = true;
		related = {
			total: globalData.related.length,
			list: globalData.related
		};

		owner = {
			id: '12826',
			avatar: 'https://cdn.frankerfacez.com/avatar/twitch/12826',
			source: `https://twitch.tv/Twitch`,
			platform: 'twitch',
			username: 'Twitch'
		};
	} else {
		const query = `query ChannelBadges {
		    user(login: "${channel ?? version}", lookupType: ALL) {
		        id
		        login
		        displayName
		        profileImageURL(width: 300)
		        broadcastBadges {
		            id
		            title
		            setID
		            version
		            clickURL
		            description
		            onClickAction
		            image_url_1x: imageURL(size: NORMAL)
		            image_url_2x: imageURL(size: DOUBLE)
		            image_url_4x: imageURL(size: QUADRUPLE)
		        }
		    }
		}`;

		const request = await fetch(`https://gql.twitch.tv/gql`, {
			credentials: 'omit',
			method: 'POST',
			headers: {
				'Accept-Language': `${getLocaleFromNavigator() || 'en-US'};q=0.9`,
				'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
			},
			body: JSON.stringify({ query })
		});

		if (!request.ok) {
			const message = request.status === 500 ? $format('error.500') : request.statusText;
			throw new Error(`[Twitch] Badge | ${request.status}: ${message}`);
		}

		const userData: TwitchUser = (await request.json()).data?.user;
		if (!userData || !userData.broadcastBadges || userData.broadcastBadges.length === 0) {
			throw new Error(`[Twitch] Badge | 404: ${$format('error.404')}`);
		}

		const badges = userData.broadcastBadges;
		const data = badges.find((b) =>
			isId ? b.image_url_4x.includes(id) : b.setID === id && b.version === version
		);

		if (!data) {
			throw new Error(`[Twitch] Badge | 404: ${$format('error.404')}`);
		}

		const versionNum = Number(data.version);
		const tier = versionNum >= 3000 ? 3 : versionNum >= 2000 ? 2 : 1;

		badge = {
			id: data.setID,
			title: data.title,
			value: data.setID === 'bits' ? $number(Number(data.version)) : undefined,
			version: data.version,
			description: data.description,
			clickAction: data.onClickAction?.length ? data.onClickAction.toLowerCase() : null,
			clickURL: data.clickURL ?? null,
			image: data.image_url_4x,
			provider: 'twitch'
		};

		const { related: relatedGlobal } = await findGlobalBadge(
			data.setID,
			data.version,
			'twitch',
			true
		);

		const relatedBadges = badges
			.filter(
				(b) =>
					b.setID === data.setID &&
					b.version !== data.version &&
					b.id !== data.id &&
					(b.setID === 'subscriber'
						? (Number(b.version) >= 3000 ? 3 : Number(b.version) >= 2000 ? 2 : 1) ===
							tier
						: true)
			)
			.map((b) => ({
				id: b.setID,
				title: b.title,
				value:
					b.setID === 'bits'
						? $number(Number(b.version))
						: b.setID === 'subscriber'
							? formatDuration(Number(b.version))
							: undefined,
				version: `${b.version}/${userData.login}`,
				description: b.description,
				image: b.image_url_4x,
				provider: 'twitch'
			}));

		const userName = compareName(userData.login, userData.displayName);
		related = {
			total: relatedBadges.length + relatedGlobal.length,
			list: [...sortBadges(relatedBadges), ...relatedGlobal]
		};

		owner = {
			id: userData.id,
			avatar: userData.profileImageURL,
			source: `https://twitch.tv/${userName}`,
			platform: 'twitch',
			username: userName
		};
	}

	const badgeId = badge.image.match(UUID);

	return {
		id: badge.id,
		name: badge.id === 'subscriber' ? formatDuration(Number(badge.version), true) : badge.title,
		provider: 'twitch',
		owner,
		images: [
			`https://static-cdn.jtvnw.net/badges/v1/${badgeId}/1`,
			`https://static-cdn.jtvnw.net/badges/v1/${badgeId}/2`,
			`https://static-cdn.jtvnw.net/badges/v1/${badgeId}/3`
		],
		description: badge.description,
		cost: badge.id === 'bits' ? Number(badge.version) : undefined,
		version: badge.version,
		clickAction: badge.clickAction,
		clickURL:
			badge.clickAction === 'subscribe'
				? `https://twitch.tv/subs/${owner?.username}`
				: (badge.clickURL ?? null),
		related,
		setId: null, // badge.id,
		source:
			isGlobal || !owner
				? null
				: `https://twitch.tv/${badge.id === 'subscriber' ? 'subs/' : ''}${owner?.username}`,
		createdAt: null
	};
}
