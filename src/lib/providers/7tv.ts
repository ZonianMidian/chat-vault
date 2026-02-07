import type {
	ChannelProvider,
	Channels,
	Channel,
	Emotes,
	Emote,
	User,
	Set
} from '$lib/types/common';
import type { STVEmote, STVChannel, Connection, STVSet } from '$lib/types/7tv';

import { $format, compareName, findGlobalEmote } from '$lib/utils';

function transformUserData(user: STVChannel): User | null {
	if (!user || user.id === '00000000000000000000000000') return null;

	const connection =
		user.connections.find((conn: Connection) => conn.platform === 'TWITCH') ||
		user.connections.find((conn: Connection) => conn.platform === 'KICK') ||
		user.connections.find((conn: Connection) => conn.platform === 'YOUTUBE');

	if (connection) {
		const username = compareName(connection.username, connection.display_name);

		return {
			id: connection.id,
			avatar: user.avatar_url,
			username: username,
			platform: connection.platform.toLowerCase() as User['platform'] | 'kick',
			source: `https://7tv.app/users/${user.id}`
		};
	}

	const username = compareName(user.username, user.display_name);

	return {
		id: user.id,
		avatar: user.avatar_url,
		username: username,
		platform: '7tv' as User['platform'] | 'kick',
		source: `https://7tv.app/users/${user.id}`
	};
}

export async function get7TVEmote(emoteId: string): Promise<Emote> {
	const url = 'https://7tv.io/v3/gql';

	const query = {
		variables: {
			id: emoteId,
			page: 1,
			limit: 18
		},
		operationName: 'Emote',
		query: `query Emote($id: ObjectID!, $page: Int, $limit: Int) {
			emote(id: $id) {
			    id
			    name
			    tags
				flags
			    listed
			    animated
			    created_at
			    personal_use
				owner {
					id
					username
					display_name
					avatar_url
					connections {
				  		id
				  		platform
				  		username
				  		display_name
					}
			    }
			    channels(page: $page, limit: $limit) {
					total
					items {
				  		id
				  		username
				  		display_name
				  		avatar_url
				  		connections {
							id
							platform
							username
							display_name
				  		}
					}
				}
			}
		}`
	};

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	});

	const result = await res.json();

	if (!res.ok || result.errors) {
		const message = res.status === 500 ? $format('status.500') : res.statusText;
		throw new Error(`[7TV] Emote | ${res.status}: ${message}`);
	}

	const data: STVEmote = result.data.emote;
	if (!data) {
		throw new Error(`[7TV] Emote | 404: ${$format('status.404')}`);
	}

	const owner = transformUserData(data.owner);

	const isGlobal = await findGlobalEmote(emoteId, '7tv');

	return {
		id: emoteId,
		name: data.name,
		provider: '7tv',
		tags: data.tags,
		owner: owner
			? {
					...owner,
					source: `https://7tv.app/users/${data.owner.id}`
				}
			: null,
		artist: null,
		images: [
			`https://cdn.7tv.app/emote/${emoteId}/1x.avif`,
			`https://cdn.7tv.app/emote/${emoteId}/2x.avif`,
			`https://cdn.7tv.app/emote/${emoteId}/3x.avif`,
			`https://cdn.7tv.app/emote/${emoteId}/4x.avif`
		],
		source: `https://7tv.app/emotes/${emoteId}`,
		createdAt: data.created_at,
		approved: data.listed,
		type: isGlobal ? 'GLOBALS' : 'CHANNEL',
		public: data.flags % 2 === 0,
		animated: data.animated,
		zero_width: [256, 257].includes(data.flags),
		global: !!isGlobal,
		deleted: false,
		channels: {
			total: data.channels.total,
			list: data.channels.items
				.map((item: STVChannel) => transformUserData(item))
				.filter(Boolean) as Channel[]
		}
	};
}

export async function get7TVChannels(emoteId: string, page: number = 1): Promise<Channels> {
	const url = 'https://7tv.io/v3/gql';

	const query = {
		variables: {
			id: emoteId,
			page: page,
			limit: 18
		},
		operationName: 'Emote',
		query: `query Emote($id: ObjectID!, $page: Int, $limit: Int) {
			emote(id: $id) {
				channels(page: $page, limit: $limit) {
					total
					items {
		  				id
		  				username
		  				display_name
		  				avatar_url
		  				connections {
							id
							platform
							username
							display_name
		  				}
					}
				}
			}
	  	}`
	};

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	});

	const result = await res.json();

	if (!res.ok || result.errors) {
		const message = res.status === 500 ? $format('status.500') : res.statusText;
		throw new Error(`[7TV] Channels | ${res.status}: ${message}`);
	}

	const data: STVEmote = result.data.emote;
	if (!data) {
		throw new Error(`[7TV] Channels | 404: ${$format('status.404')}`);
	}

	return {
		total: data.channels.total,
		list: data.channels.items
			.map((item: STVChannel) => transformUserData(item))
			.filter(Boolean) as Channel[]
	};
}

export async function get7TVGlobalEmotes(): Promise<Emotes[]> {
	const url = 'https://7tv.io/v3/emote-sets/global';

	const res = await fetch(url);
	if (!res.ok) {
		const message = res.status === 500 ? $format('status.500') : res.statusText;
		throw new Error(`[7TV] Global Emotes | ${res.status}: ${message}`);
	}

	const body: STVSet = await res.json();
	if (!body) {
		throw new Error(`[7TV] Global Emotes | 404: ${$format('status.404')}`);
	}

	return body.emotes.map((emote) => ({
		id: emote.id,
		name: emote.name,
		image: `https://cdn.7tv.app/emote/${emote.id}/4x.avif`,
		zero_width: [256, 257].includes(emote.data.flags as number),
		owner: transformUserData(emote.data.owner as STVChannel)?.username || null,
		provider: '7tv'
	}));
}

export async function get7TVEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' | 'kick' = 'twitch'
): Promise<ChannelProvider> {
	const url = 'https://7tv.io/v3/gql';

	const query = {
		variables: {
			id: userId,
			platform: platform.toUpperCase()
		},
		operationName: 'Emotes',
		query: `query Emotes($id: String!, $platform: ConnectionPlatform!) {
  			userByConnection(id: $id, platform: $platform) {
    			emote_sets {
      				id
      				name
      				emotes {
        				id
        				name
        				data {
							flags
        					owner {
        						display_name
        						username
								id
        					}
        				}
      				}
    			}
    			connections {
      				emote_set_id
					display_name
					username
      				platform
      				id
    			}
    			avatar_url
				id
  			}
		}`
	};

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	});

	const result = await res.json();

	if (!res.ok || result.errors) {
		const message = res.status === 500 ? $format('status.500') : res.statusText;
		throw new Error(`[7TV] User | ${res.status}: ${message}`);
	}

	const data: STVChannel = result.data.userByConnection;
	if (!data || data.id === '00000000000000000000000000') {
		throw new Error(`[7TV] User | 404: ${$format('status.404')}`);
	}

	return {
		provider: '7tv',
		bots: [],
		sets: data.emote_sets.map((set) => ({
			id: set.id,
			name: set.name.endsWith(`\'s Emotes`) ? null : set.name,
			subtitle: null,
			tags: [],
			source: `https://7tv.app/users/${data.id}/emote-sets`,
			provider: '7tv',
			mainSet: data.connections
				.filter((conn: Connection) => conn.platform === platform.toUpperCase())
				.some((conn: Connection) => conn.emote_set_id === set.id),
			owner: transformUserData(data),
			emotes: set.emotes.map((emote) => ({
				id: emote.id,
				name: emote.name,
				image: `https://cdn.7tv.app/emote/${emote.id}/4x.avif`,
				zero_width: [256, 257].includes(emote.data.flags as number),
				owner:
					emote.data.owner && emote.data.owner.id !== '00000000000000000000000000'
						? compareName(emote.data.owner.username, emote.data.owner.display_name)
						: null,
				provider: '7tv'
			}))
		}))
	};
}

export async function get7TVSet(setId: string): Promise<Set> {
	const url = `https://7tv.io/v3/emote-sets/${setId}`;

	const res = await fetch(url);
	if (!res.ok) {
		const message = res.status === 500 ? $format('status.500') : res.statusText;
		throw new Error(`[7TV] Set | ${res.status}: ${message}`);
	}

	const data: STVSet = await res.json();
	if (!data) {
		throw new Error(`[7TV] Set | 404: ${$format('status.404')}`);
	}

	return {
		id: data.id,
		name: data.name.endsWith(`\'s Emotes`) ? null : data.name,
		subtitle: null,
		tags: data.tags,
		owner: transformUserData(data.owner),
		source: `https://7tv.app/emote-sets/${setId}`,
		provider: '7tv',
		emotes: data.emotes?.map((emote) => ({
			id: emote.id,
			name: emote.name,
			image: `https://cdn.7tv.app/emote/${emote.id}/4x.avif`,
			zero_width: [256, 257].includes(emote.data.flags as number),
			owner:
				emote.data.owner && emote.data.owner.id !== '00000000000000000000000000'
					? compareName(emote.data.owner.username, emote.data.owner.display_name)
					: null,
			provider: '7tv'
		})) || []
	};
}
