import type {
	ChannelProvider,
	Channels,
	Channel,
	Emotes,
	Emote,
	User,
	Set
} from '#lib/types/common.ts';
import type { STVEmote, STVChannel, Connection, STVSet, STVSearch } from '#lib/types/7tv.ts';
import type { PageRequest, SearchPage } from '#lib/server/emotes/pages.ts';
import type { EmoteSearchOptions } from '#lib/emotes/search.ts';
import type { EmoteContext } from './context';

import { fetchRange, toOffset } from '#lib/server/emotes/pages.ts';
import { ProviderError, request, requestJson } from '#lib/server/http.ts';
import { compareName, ulidDate } from '#lib/utils/index.ts';

const GQL = 'https://7tv.io/v3/gql';
const GQL_V4 = 'https://api.7tv.app/v4/gql';
const NIL_ID = '00000000000000000000000000';

export const CHANNELS_PER_PAGE = 18;

const emoteImage = (emoteId: string, scale = 4): string =>
	`https://cdn.7tv.app/emote/${emoteId}/${scale}x.avif`;

const isZeroWidth = (flags: number | undefined): boolean => [256, 257].includes(flags as number);

const setName = (name: string): string | null => (name.endsWith(`'s Emotes`) ? null : name);

const userFields = `
	id
	username
	display_name
	avatar_url
	connections {
		id
		platform
		username
		display_name
	}`;

const channelsFields = `
	channels(page: $page, limit: $limit) {
		total
		items {${userFields}
		}
	}`;

async function gql<T>(
	source: string,
	operationName: string,
	query: string,
	variables: Record<string, unknown>,
	endpoint = GQL
): Promise<T> {
	let res: Response;

	try {
		res = await request(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ operationName, query, variables })
		});
	} catch {
		throw new ProviderError(source, 503);
	}

	const result = await res.json().catch(() => null);

	if (!res.ok || !result || result.errors) {
		throw new ProviderError(source, res.ok ? 404 : res.status);
	}

	return result.data as T;
}

function transformUserData(user: STVChannel | null | undefined): User | null {
	if (!user || user.id === NIL_ID) return null;

	const connections = user.connections ?? [];
	const connection =
		connections.find((conn: Connection) => conn.platform === 'TWITCH') ||
		connections.find((conn: Connection) => conn.platform === 'KICK') ||
		connections.find((conn: Connection) => conn.platform === 'YOUTUBE');

	if (connection) {
		return {
			id: connection.id,
			avatar: user.avatar_url,
			username: compareName(connection.username, connection.display_name),
			platform: connection.platform.toLowerCase() as User['platform'],
			source: `https://7tv.app/users/${user.id}`
		};
	}

	return {
		id: user.id,
		avatar: user.avatar_url,
		username: compareName(user.username, user.display_name),
		platform: '7tv' as User['platform'],
		source: `https://7tv.app/users/${user.id}`
	};
}

function transformChannels(channels: STVEmote['channels']): Channels {
	return {
		total: channels.total,
		list: channels.items.map(transformUserData).filter(Boolean) as Channel[]
	};
}

function transformSetEmotes(emotes: STVEmote[] | null | undefined): Emotes[] {
	return (emotes ?? []).map((emote) => ({
		id: emote.id,
		name: emote.name,
		image: emoteImage(emote.id),
		zero_width: isZeroWidth(emote.data.flags),
		owner:
			emote.data.owner && emote.data.owner.id !== NIL_ID
				? compareName(emote.data.owner.username, emote.data.owner.display_name)
				: null,
		provider: '7tv'
	}));
}

export async function get7TVEmote(emoteId: string, ctx: EmoteContext): Promise<Emote> {
	const source = '[7TV] Emote';

	const data = (
		await gql<{ emote: STVEmote | null }>(
			source,
			'Emote',
			`query Emote($id: ObjectID!, $page: Int, $limit: Int) {
				emote(id: $id) {
					id
					name
					tags
					flags
					listed
					animated
					created_at
					personal_use
					owner {${userFields}
					}${channelsFields}
				}
			}`,
			{ id: emoteId, page: 1, limit: CHANNELS_PER_PAGE }
		)
	).emote;

	if (!data) {
		throw new ProviderError(source, 404);
	}

	return {
		id: emoteId,
		name: data.name,
		provider: '7tv',
		tags: data.tags,
		owner: transformUserData(data.owner),
		artist: null,
		images: [1, 2, 3, 4].map((scale) => emoteImage(emoteId, scale)),
		source: `https://7tv.app/emotes/${emoteId}`,
		createdAt: data.created_at,
		approved: data.listed,
		type: ctx.global ? 'GLOBALS' : 'CHANNEL',
		public: data.flags % 2 === 0,
		animated: data.animated,
		zero_width: isZeroWidth(data.flags),
		global: !!ctx.global,
		deleted: false,
		channels: transformChannels(data.channels)
	};
}

export async function get7TVChannels(emoteId: string, page: number = 1): Promise<Channels> {
	const source = '[7TV] Channels';

	const data = (
		await gql<{ emote: STVEmote | null }>(
			source,
			'Emote',
			`query Emote($id: ObjectID!, $page: Int, $limit: Int) {
				emote(id: $id) {${channelsFields}
				}
			}`,
			{ id: emoteId, page, limit: CHANNELS_PER_PAGE }
		)
	).emote;

	if (!data) {
		throw new ProviderError(source, 404);
	}

	return transformChannels(data.channels);
}

export async function get7TVGlobalEmotes(): Promise<Emotes[]> {
	const source = '[7TV] Global Emotes';
	const body = await requestJson<STVSet>(source, 'https://7tv.io/v3/emote-sets/global');

	if (!body?.emotes) {
		throw new ProviderError(source, 404);
	}

	return body.emotes.map((emote) => ({
		id: emote.id,
		name: emote.name,
		image: emoteImage(emote.id),
		zero_width: isZeroWidth(emote.data.flags),
		owner: transformUserData(emote.data.owner)?.username || null,
		provider: '7tv'
	}));
}

export async function get7TVEmotes(
	userId: string,
	platform: 'twitch' | 'youtube' | 'kick' = 'twitch'
): Promise<ChannelProvider> {
	const source = '[7TV] User';

	const data = (
		await gql<{ userByConnection: STVChannel | null }>(
			source,
			'Emotes',
			`query Emotes($id: String!, $platform: ConnectionPlatform!) {
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
			}`,
			{ id: userId, platform: platform.toUpperCase() }
		)
	).userByConnection;

	if (!data || data.id === NIL_ID) {
		throw new ProviderError(source, 404);
	}

	const mainSets = data.connections
		.filter((conn: Connection) => conn.platform === platform.toUpperCase())
		.map((conn: Connection) => conn.emote_set_id);

	return {
		provider: '7tv',
		bots: [],
		sets: data.emote_sets.map((set) => ({
			id: set.id,
			name: setName(set.name),
			subtitle: null,
			tags: [],
			source: `https://7tv.app/users/${data.id}/emote-sets`,
			provider: '7tv',
			mainSet: mainSets.includes(set.id),
			owner: transformUserData(data),
			emotes: transformSetEmotes(set.emotes)
		}))
	};
}

const searchSort: Record<EmoteSearchOptions['sort'], [string, string] | null> = {
	relevance: null,
	'owner-asc': null,
	'owner-desc': null,
	'name-asc': null,
	'name-desc': null,
	'date-desc': ['UPLOAD_DATE', 'DESCENDING'],
	'date-asc': ['UPLOAD_DATE', 'ASCENDING']
};

export async function search7TVEmotes(
	options: EmoteSearchOptions,
	request: PageRequest
): Promise<SearchPage> {
	const source = '[7TV] Search';
	const query = options.query.trim();
	const [sortBy, order] = searchSort[options.sort] ?? [
		query ? 'TOP_ALL_TIME' : 'TRENDING_WEEKLY',
		'DESCENDING'
	];

	const fetchPage = async (page: number, perPage: number) => {
		const { search } = (await searchPage(source, query, sortBy, order, options, page, perPage))
			.emotes;
		return { items: search.items, more: page < search.pageCount };
	};

	const { items, next } = await fetchRange(
		toOffset(request.cursor),
		Math.min(request.count, 100),
		fetchPage
	);

	return {
		next: next === null ? null : String(next),
		emotes: items
			.filter((emote) => !emote.deleted)
			.map((emote) => {
				const connection = emote.owner?.mainConnection;

				return {
					id: emote.id,
					name: emote.defaultName,
					image: emoteImage(emote.id),
					owner: connection
						? compareName(connection.platformUsername, connection.platformDisplayName)
						: null,
					zero_width: emote.flags.defaultZeroWidth,
					animated: emote.flags.animated,
					createdAt: ulidDate(emote.id),
					provider: '7tv'
				};
			})
	};
}

function searchPage(
	source: string,
	query: string,
	sortBy: string,
	order: string,
	options: EmoteSearchOptions,
	page: number,
	perPage: number
): Promise<STVSearch> {
	return gql<STVSearch>(
		source,
		'EmoteSearch',
		`query EmoteSearch($query: String, $sortBy: SortBy!, $order: SortOrder!, $filters: Filters, $page: Int, $perPage: Int!) {
			emotes {
				search(
					query: $query
					tags: { tags: [], match: ANY }
					sort: { sortBy: $sortBy, order: $order }
					filters: $filters
					page: $page
					perPage: $perPage
				) {
					items {
						id
						defaultName
						deleted
						flags {
							animated
							defaultZeroWidth
						}
						owner {
							id
							mainConnection {
								platformUsername
								platformDisplayName
							}
						}
					}
					totalCount
					pageCount
				}
			}
		}`,
		{
			query: query || null,
			sortBy,
			order,
			page,
			perPage,
			filters: {
				exactMatch: options.exact && !!query,
				animated: options.format === 'all' ? undefined : options.format === 'animated',
				defaultZeroWidth: options.zeroWidth || undefined,
				approvedPersonal: options.personal || undefined
			}
		},
		GQL_V4
	);
}

export async function get7TVSet(setId: string): Promise<Set> {
	const source = '[7TV] Set';
	const data = await requestJson<STVSet>(
		source,
		`https://7tv.io/v3/emote-sets/${encodeURIComponent(setId)}`
	);

	if (!data) {
		throw new ProviderError(source, 404);
	}

	return {
		id: data.id,
		name: setName(data.name),
		subtitle: null,
		tags: data.tags,
		owner: transformUserData(data.owner),
		source: `https://7tv.app/emote-sets/${setId}`,
		provider: '7tv',
		emotes: transformSetEmotes(data.emotes)
	};
}
