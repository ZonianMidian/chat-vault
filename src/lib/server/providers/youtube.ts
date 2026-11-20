import type {
	Badge,
	Badges,
	CategoryInfo,
	ChannelData,
	OfflineInfo,
	Emote,
	Emotes,
	Socials,
	StreamInfo,
	User
} from '#lib/types/common.ts';
import type { BadgeContext, EmoteContext } from './context';
import type { Translator } from '#lib/server/i18n.ts';

import { createHash } from 'node:crypto';

import { cached, peek, profiles, storeAll, type CacheProfile } from '#lib/server/cache.ts';
import { ProviderError, exists, requestJson } from '#lib/server/http.ts';
import Globals from '#lib/server/emotes/data/ytGlobals.json';
import { getFavicon } from '#lib/utils/index.ts';
import { config } from '#lib/server/config.ts';
import { log } from '#lib/server/logger.ts';

const ORIGIN = 'https://www.youtube.com';
const INNERTUBE = `${ORIGIN}/youtubei/v1`;
const CLIENT = { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en', gl: 'US' };

const SEARCH_CHANNELS = 'EgIQAg==';
const TAB_VIDEOS = 'EgZ2aWRlb3PyBgQKAjoA';
const TAB_STREAMS = 'EgdzdHJlYW1z8gYECgJ6AA%3D%3D';

const CHANNEL_ID = /^UC[\w-]{22}$/;

const GLOBAL_EMOJIS = 'UCkszU2WH9gy1mb0dV-11UJg';
const YOUTUBE_CHANNEL = 'UCBR8-60-B28hp2BmDPdntcQ';

const COMMENT_VIDEOS = 3;
const CHAT_STREAMS = 2;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const youtubeOwner: User = {
	id: YOUTUBE_CHANNEL,
	avatar: 'https://yt3.ggpht.com/Bg5wS82KGryRmcsn1YbPThtbXoTmj2XJ9_7LmuE2RF6wbKJBkovfRypbSz6UD3gEu_nHiwGZtQ=s300',
	source: 'https://youtube.com/@YouTube',
	username: 'YouTube',
	platform: 'youtube'
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const channelUrl = (channelId: string): string => `https://youtube.com/channel/${channelId}`;

const image = (id: string, options: string): string => `https://yt3.ggpht.com/${id}=${options}`;
const imageId = (url: string): string | null =>
	url.match(/^(?:https?:)?\/\/yt3\.(?:ggpht|googleusercontent)\.com\/(.+?)(?:=[^=/]*)?$/)?.[1] ??
	null;

const emoteImage = (emoteId: string, size: number): string => image(emoteId, `s${size}-c`);
const badgeImage = (badgeId: string, size: number): string => image(badgeId, `s${size}-c-k`);

function innertube(
	source: string,
	endpoint: string,
	body: object,
	headers: Record<string, string> = {}
): Promise<Json> {
	return requestJson<Json>(source, `${INNERTUBE}/${endpoint}?prettyPrint=false`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify({ context: { client: CLIENT }, ...body })
	});
}

function sessionHeaders(): Record<string, string> | null {
	const cookie = config.youtube.cookie.trim();
	if (!cookie) return null;

	const secret = cookie.match(/(?:^|;\s*)(?:SAPISID|__Secure-3PAPISID)=([^;]+)/)?.[1];
	if (!secret) {
		log.warn('YouTube', '`youtube.cookie` has no SAPISID: copy the whole Cookie header');
		return null;
	}

	const time = Math.floor(Date.now() / 1000);
	const hash = createHash('sha1').update(`${time} ${secret} ${ORIGIN}`).digest('hex');

	return {
		Cookie: cookie,
		Authorization: `SAPISIDHASH ${time}_${hash}`,
		Origin: ORIGIN,
		'X-Origin': ORIGIN,
		'X-Goog-AuthUser': '0'
	};
}

function* descend(node: Json, key: string): Generator<Json> {
	if (!node || typeof node !== 'object') return;

	for (const [name, value] of Object.entries(node)) {
		if (name === key) yield value;
		yield* descend(value, key);
	}
}

const absolute = (url: string | undefined): string | null =>
	url ? (url.startsWith('//') ? `https:${url}` : url) : null;

const largest = (sources: { url: string }[] | undefined): string | null =>
	absolute(sources?.at(-1)?.url);

const toDate = (value: string | number | undefined): Date | null => {
	if (!value) return null;

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

function parseCount(text: string | undefined): number {
	const match = text?.match(/([\d.,]+)\s*([KMB])?/i);
	if (!match) return 0;

	const scale = { K: 1e3, M: 1e6, B: 1e9 }[match[2]?.toUpperCase() ?? ''] ?? 1;
	return Math.round(Number(match[1].replace(/,/g, '')) * scale);
}

interface ChannelBasics {
	id: string;
	name: string;
	description: string | null;
	source: string;
	avatar: string;
	banner: string | null;
	followers: number;
	createdAt: Date | null;
	verified: boolean;
}

interface Alternative {
	name: string;
	resolveId(name: string): Promise<string | null>;
	channel(channelId: string): Promise<ChannelBasics | null>;
	search(query: string, limit: number): Promise<User[]>;
}

const DATA_API = 'https://www.googleapis.com/youtube/v3';

type Thumbnails = Record<string, { url?: string } | undefined>;

interface DataApiList<T> {
	items?: T[];
}

interface DataApiChannel {
	id: string;
	snippet?: {
		title?: string;
		description?: string;
		customUrl?: string;
		publishedAt?: string;
		thumbnails?: Thumbnails;
	};
	statistics?: { subscriberCount?: string };
	brandingSettings?: { image?: { bannerExternalUrl?: string } };
}

interface DataApiSearchResult {
	snippet?: { channelId?: string; title?: string; thumbnails?: Thumbnails };
}

interface DataApiVideo {
	liveStreamingDetails?: { actualStartTime?: string; concurrentViewers?: string };
}

function dataApi<T>(resource: string, query: Record<string, string>): Promise<DataApiList<T>> {
	const url = new URL(`${DATA_API}/${resource}`);
	url.search = new URLSearchParams({ ...query, key: config.youtube.apiKey }).toString();

	return requestJson<DataApiList<T>>('[YouTube] Data API', url);
}

const thumbnail = (thumbnails: Thumbnails | undefined): string =>
	thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? '';

const official: Alternative = {
	name: 'Data API',

	async resolveId(name) {
		const ask = async (query: Record<string, string>): Promise<string | null> =>
			(await dataApi<DataApiChannel>('channels', { part: 'id', ...query })).items?.[0]?.id ??
			null;

		if (name.startsWith('@')) return ask({ forHandle: name });

		const [byHandle, byUsername] = await Promise.all([
			ask({ forHandle: `@${name}` }),
			ask({ forUsername: name })
		]);
		return byHandle ?? byUsername;
	},

	async channel(channelId) {
		const { items } = await dataApi<DataApiChannel>('channels', {
			part: 'snippet,statistics,brandingSettings',
			id: channelId
		});

		const channel = items?.[0];
		if (!channel?.snippet?.title) return null;

		const { snippet, statistics, brandingSettings } = channel;
		const banner = brandingSettings?.image?.bannerExternalUrl;

		return {
			id: channel.id,
			name: snippet.title as string,
			description: snippet.description?.trim() || null,
			source: snippet.customUrl
				? `https://youtube.com/${snippet.customUrl}`
				: channelUrl(channel.id),
			avatar: thumbnail(snippet.thumbnails),
			banner: banner
				? `${banner}=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`
				: null,
			followers: Number(statistics?.subscriberCount) || 0,
			createdAt: toDate(snippet.publishedAt),
			verified: false
		};
	},

	async search(query, limit) {
		const { items } = await dataApi<DataApiSearchResult>('search', {
			part: 'snippet',
			type: 'channel',
			q: query,
			maxResults: String(Math.min(limit, 50))
		});

		return (items ?? []).flatMap(({ snippet }): User[] => {
			if (!snippet?.channelId || !snippet.title) return [];

			return [
				{
					id: snippet.channelId,
					username: snippet.title,
					avatar: thumbnail(snippet.thumbnails) || undefined,
					source: channelUrl(snippet.channelId),
					platform: 'youtube'
				}
			];
		});
	}
};

interface InvidiousImage {
	url?: string;
	width?: number;
}

interface InvidiousChannel {
	author?: string;
	authorId?: string;
	authorVerified?: boolean;
	authorBanners?: InvidiousImage[];
	authorThumbnails?: InvidiousImage[];
	subCount?: number;
	joined?: number;
	description?: string;
}

function invidiousBase(): string {
	const instance = config.youtube.invidious.trim().replace(/\/+$/, '');
	return /^https?:\/\//i.test(instance) ? instance : `https://${instance}`;
}

function invidiousApi<T>(path: string, query: Record<string, string> = {}): Promise<T> {
	const url = new URL(`${invidiousBase()}/api/v1/${path}`);
	url.search = new URLSearchParams(query).toString();

	return requestJson<T>('[YouTube] Invidious', url);
}

const widest = (images: InvidiousImage[] | undefined): string | null =>
	absolute(images?.toSorted((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url);

const invidious: Alternative = {
	name: 'Invidious',

	async resolveId(name) {
		const handle = name.startsWith('@') ? name : `@${name}`;
		const { ucid } = await invidiousApi<{ ucid?: string }>('resolveurl', {
			url: `${ORIGIN}/${handle}`
		});

		return ucid ?? null;
	},

	async channel(channelId) {
		const channel = await invidiousApi<InvidiousChannel>(
			`channels/${encodeURIComponent(channelId)}`
		);
		if (!channel.authorId || !channel.author) return null;

		return {
			id: channel.authorId,
			name: channel.author,
			description: channel.description?.trim() || null,
			source: channelUrl(channel.authorId),
			avatar: widest(channel.authorThumbnails) ?? '',
			banner: widest(channel.authorBanners),
			followers: channel.subCount ?? 0,
			createdAt: toDate(channel.joined ? channel.joined * 1000 : undefined),
			verified: !!channel.authorVerified
		};
	},

	async search(query, limit) {
		const results = await invidiousApi<(InvidiousChannel & { type?: string })[]>('search', {
			q: query,
			type: 'channel'
		});

		return (Array.isArray(results) ? results : [])
			.filter((item) => item.type === 'channel' && item.authorId && item.author)
			.slice(0, limit)
			.map((item) => ({
				id: item.authorId as string,
				username: item.author as string,
				avatar: widest(item.authorThumbnails) ?? undefined,
				source: channelUrl(item.authorId as string),
				platform: 'youtube'
			}));
	}
};

function alternatives(): Alternative[] {
	return [
		...(config.youtube.apiKey ? [official] : []),
		...(config.youtube.invidious.trim() ? [invidious] : [])
	];
}

async function askAlternatives<T>(
	what: string,
	ask: (api: Alternative) => Promise<T | null>
): Promise<T | null> {
	for (const api of alternatives()) {
		try {
			const answer = await ask(api);

			if (answer !== null && !(Array.isArray(answer) && answer.length === 0)) {
				log.info('YouTube', `Got ${what} from ${api.name}`);
				return answer;
			}
		} catch (err) {
			if (!(err instanceof ProviderError && err.status === 404)) {
				log.warn('YouTube', `${api.name} could not provide ${what}`, err);
			}
		}
	}

	return null;
}

interface LiveDetails {
	startedAt: Date | null;
	viewers: number | null;
}

async function fetchLiveDetails(videoId: string): Promise<LiveDetails | null> {
	if (!config.youtube.apiKey) return null;

	try {
		const { items } = await dataApi<DataApiVideo>('videos', {
			part: 'liveStreamingDetails',
			id: videoId
		});

		const details = items?.[0]?.liveStreamingDetails;
		if (!details) return null;

		return {
			startedAt: toDate(details.actualStartTime),
			viewers: details.concurrentViewers ? Number(details.concurrentViewers) : null
		};
	} catch (err) {
		log.warn('YouTube', `Data API could not provide the details of the stream ${videoId}`, err);
		return null;
	}
}

const LIVE_DESTINATION = 'UC4R8DWoMoI7CAwX8_LjQHig';

const textOf = (node: Json): string | undefined =>
	node?.simpleText ?? node?.runs?.map((run: Json) => run.text).join('');

function countFrom(text: string | undefined): number | null {
	const match = text?.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);
	if (!match) return null;

	const scale = { K: 1e3, M: 1e6, B: 1e9 }[match[2]?.toUpperCase() ?? ''] ?? 1;
	return Math.round(Number(match[1]) * scale);
}

const LIVE_NOW_GRID = 'EgdsaXZldGFikgEDCKEK';
const MAX_CONTINUATIONS = 3;

export interface YouTubeLiveCursor {
	token: string;
	visitor: string;
}

export interface YouTubeLivePage {
	channels: User[];
	next: YouTubeLiveCursor | null;
}

function liveContinuation(data: Json, previous?: string): YouTubeLiveCursor | null {
	const token = descend(data, 'continuationCommand').next().value?.token;
	const visitor = data?.responseContext?.visitorData ?? previous;

	return typeof token === 'string' && typeof visitor === 'string' ? { token, visitor } : null;
}

export async function getYouTubeLiveChannels(
	cursor: YouTubeLiveCursor | null = null,
	minimum = 0
): Promise<YouTubeLivePage> {
	const source = '[YouTube] Live Channels';

	if (!cursor) {
		const pages = await Promise.all([
			innertube(source, 'browse', { browseId: LIVE_DESTINATION, params: LIVE_NOW_GRID }),
			innertube(source, 'browse', { browseId: LIVE_DESTINATION }).catch(() => null)
		]);

		return { channels: liveChannels(pages), next: liveContinuation(pages[0]) };
	}

	const pages: Json[] = [];
	let next: YouTubeLiveCursor | null = cursor;

	for (let i = 0; i < MAX_CONTINUATIONS && next; i++) {
		const page: Json = await innertube(source, 'browse', {
			context: { client: { ...CLIENT, visitorData: next.visitor } },
			continuation: next.token
		});

		pages.push(page);
		next = liveContinuation(page, next.visitor);

		if (liveChannels(pages).length >= minimum) break;
	}

	return { channels: liveChannels(pages), next };
}

function liveChannels(pages: Json[]): User[] {
	const channels = new Map<string, User>();

	for (const video of pages.flatMap((page) => [...descend(page, 'videoRenderer')])) {
		const run = (video?.ownerText ?? video?.longBylineText)?.runs?.[0];
		const id: string | undefined = run?.navigationEndpoint?.browseEndpoint?.browseId;
		const watching = textOf(video?.viewCountText);

		if (!id || !CHANNEL_ID.test(id) || channels.has(id) || !/watching/i.test(watching ?? '')) {
			continue;
		}

		channels.set(id, {
			id,
			username: run.text,
			avatar:
				largest(
					video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
						?.thumbnail?.thumbnails
				) ?? undefined,
			source: channelUrl(id),
			platform: 'youtube',
			viewers: countFrom(watching)
		});
	}

	return [...channels.values()].sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0));
}

export async function searchYouTubeChannel(search: string, limit = 20): Promise<User[]> {
	try {
		const data = await innertube('[YouTube] Channels', 'search', {
			query: search,
			params: SEARCH_CHANNELS
		});

		const sections: Json[] =
			data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
				?.contents ?? [];

		return sections
			.flatMap((section) => section?.itemSectionRenderer?.contents ?? [])
			.map((item: Json) => item?.channelRenderer)
			.filter((channel: Json) => channel?.channelId && channel?.title?.simpleText)
			.slice(0, limit)
			.map((channel: Json) => ({
				id: channel.channelId,
				username: channel.title.simpleText,
				avatar: largest(channel.thumbnail?.thumbnails) ?? undefined,
				source: channelUrl(channel.channelId),
				platform: 'youtube',
				followers: countFrom(
					[textOf(channel.subscriberCountText), textOf(channel.videoCountText)].find(
						(text) => /subscriber/i.test(text ?? '')
					)
				)
			}));
	} catch (err) {
		const results = await askAlternatives(`the channels matching "${search}"`, (api) =>
			api.search(search, limit)
		);
		if (results) return results;

		throw err;
	}
}

export function resolveYouTubeChannelId(channel: string): Promise<string> {
	if (CHANNEL_ID.test(channel)) return Promise.resolve(channel);

	return cached(`youtube:id:${channel.toLowerCase()}`, profiles.static, async () => {
		const source = '[YouTube] Channel';
		const name = encodeURIComponent(channel.replace(/^@/, ''));

		const paths = channel.startsWith('@')
			? [`@${name}`]
			: [`@${name}`, `c/${name}`, `user/${name}`];

		const answers = await Promise.all(
			paths.map((path) =>
				innertube(source, 'navigation/resolve_url', { url: `${ORIGIN}/${path}` }).catch(
					() => null
				)
			)
		);

		for (const data of answers) {
			const id = data?.endpoint?.browseEndpoint?.browseId;
			if (typeof id === 'string' && CHANNEL_ID.test(id)) return id;
		}

		const id = await askAlternatives(`the id of ${channel}`, (api) => api.resolveId(channel));
		if (id && CHANNEL_ID.test(id)) return id;

		throw new ProviderError(source, 404);
	});
}

interface Video {
	id: string;
	title: string | null;
	thumbnail: string | null;
	live: boolean;
	upcoming: boolean;
}

async function listVideos(channelId: string, tab: string): Promise<Video[]> {
	const data = await innertube('[YouTube] Videos', 'browse', {
		browseId: channelId,
		params: tab
	});

	const tabs: Json[] = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
	const items: Json[] =
		tabs.find((item) => item?.tabRenderer?.selected)?.tabRenderer?.content?.richGridRenderer
			?.contents ?? [];

	return items.flatMap((item): Video[] => {
		const content = item?.richItemRenderer?.content;
		const id = content?.lockupViewModel?.contentId ?? content?.videoRenderer?.videoId;
		if (typeof id !== 'string' || !/^[\w-]{11}$/.test(id)) return [];

		const text = JSON.stringify(content);
		const lockup = content?.lockupViewModel;

		return [
			{
				id,
				title:
					lockup?.metadata?.lockupMetadataViewModel?.title?.content ??
					content?.videoRenderer?.title?.runs?.[0]?.text ??
					null,
				thumbnail:
					largest(
						lockup?.contentImage?.thumbnailViewModel?.image?.sources ??
							content?.videoRenderer?.thumbnail?.thumbnails
					)?.split('?')[0] ?? null,
				live: /BADGE_STYLE_LIVE|"style":"LIVE"/.test(text),
				upcoming:
					/"upcomingEventData"|"(?:text|content)":"(?:Upcoming|Scheduled|Premieres)/i.test(
						text
					)
			}
		];
	});
}

const aired = (videos: Video[]): string[] =>
	videos.filter((video) => !video.live && !video.upcoming).map(({ id }) => id);

type BadgeSample = [label: string, url: string];

interface Sample {
	emojis: Json[];
	badges: BadgeSample[];
}

async function readComments(videoId: string): Promise<Sample | null> {
	const source = '[YouTube] Comments';

	try {
		const watch = await innertube(source, 'next', { videoId });

		const sections: Json[] =
			watch?.contents?.twoColumnWatchNextResults?.results?.results?.contents ?? [];
		const continuation = sections.find(
			(section) => section?.itemSectionRenderer?.sectionIdentifier === 'comment-item-section'
		)?.itemSectionRenderer?.contents?.[0]?.continuationItemRenderer?.continuationEndpoint
			?.continuationCommand?.token;
		if (!continuation) return null;

		const data = await innertube(source, 'next', { continuation });

		const header = (data?.onResponseReceivedEndpoints ?? [])
			.flatMap(
				(endpoint: Json) =>
					endpoint?.reloadContinuationItemsCommand?.continuationItems ??
					endpoint?.appendContinuationItemsAction?.continuationItems ??
					[]
			)
			.find((item: Json) => item?.commentsHeaderRenderer)?.commentsHeaderRenderer;
		if (!header) return null;

		const badges = (data?.frameworkUpdates?.entityBatchUpdate?.mutations ?? []).flatMap(
			(mutation: Json): BadgeSample[] => {
				const author = mutation?.payload?.commentEntityPayload?.author;
				return author?.sponsorBadgeUrl
					? [[author.sponsorBadgeA11y ?? '', author.sponsorBadgeUrl]]
					: [];
			}
		);

		return { emojis: header.customEmojis ?? [], badges };
	} catch (err) {
		log.debug('YouTube', `Could not read the comments of ${videoId}`, err);
		return null;
	}
}

interface ChatRef {
	continuation: string;
	isReplay: boolean;
}

function chatOf(watch: Json): ChatRef | null {
	const renderer = watch?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;
	const continuation = renderer?.continuations?.[0]?.reloadContinuationData?.continuation;

	return continuation ? { continuation, isReplay: !!renderer.isReplay } : null;
}

async function sampleChat(chat: ChatRef): Promise<Sample> {
	const data = await innertube(
		'[YouTube] Chat',
		chat.isReplay ? 'live_chat/get_live_chat_replay' : 'live_chat/get_live_chat',
		{ continuation: chat.continuation }
	);

	const actions = data?.continuationContents?.liveChatContinuation?.actions ?? [];

	return {
		emojis: [...descend(actions, 'emoji')],
		badges: [...descend(actions, 'liveChatAuthorBadgeRenderer')].flatMap(
			(badge): BadgeSample[] => {
				const url = largest(badge?.customThumbnail?.thumbnails);
				return url ? [[badge.tooltip ?? '', url]] : [];
			}
		)
	};
}

async function sampleChats(live: ChatRef | null, past: string[]): Promise<Sample[]> {
	const replays = past.slice(0, CHAT_STREAMS - (live ? 1 : 0)).map(async (videoId) => {
		const chat = chatOf(await innertube('[YouTube] Chat', 'next', { videoId }));
		return chat ? sampleChat(chat) : null;
	});

	const samples = await Promise.all(
		[...(live ? [sampleChat(live)] : []), ...replays].map((sample) =>
			sample.catch((err): null => {
				log.debug('YouTube', 'Could not read a chat', err);
				return null;
			})
		)
	);

	return samples.filter((sample) => sample !== null);
}

interface StreamLookup {
	stream: StreamInfo | null;
	chat: ChatRef | null;
	past: string[];
}

const noStream: StreamLookup = { stream: null, chat: null, past: [] };

function getCategory(watch: Json): CategoryInfo | null {
	const toCategory = (name: Json, path: Json, boxArt: string | null): CategoryInfo | null =>
		typeof name === 'string' && name && typeof path === 'string'
			? { url: new URL(path, ORIGIN).href, name, boxArt }
			: null;

	for (const section of descend(watch?.engagementPanels, 'videoAttributesSectionViewModel')) {
		if (section?.footerButton?.buttonViewModel?.iconName !== 'GAMING_LOGO') continue;

		const game = section.videoAttributeViewModels?.[0]?.videoAttributeViewModel;
		const category = toCategory(
			game?.title,
			game?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url,
			largest(game?.image?.sources)
		);
		if (category) return category;
	}

	for (const game of descend(watch?.contents, 'richMetadataRenderer')) {
		if (game?.style !== 'RICH_METADATA_RENDERER_STYLE_BOX_ART') continue;

		const category = toCategory(
			game.title?.simpleText ?? game.title?.runs?.[0]?.text,
			game.endpoint?.commandMetadata?.webCommandMetadata?.url,
			largest(game.thumbnail?.thumbnails)
		);
		if (category) return category;
	}

	return null;
}

async function streamPreview(videoId: string): Promise<string> {
	const frame = (quality: string): string =>
		`https://i.ytimg.com/vi/${videoId}/${quality}_live.jpg`;

	return (await exists(frame('maxresdefault'))) ? frame('maxresdefault') : frame('hqdefault');
}

async function findStream(channelId: string): Promise<StreamLookup> {
	const source = '[YouTube] Stream';

	const videos = await listVideos(channelId, TAB_STREAMS);
	const past = aired(videos);

	const videoId = videos.find((video) => video.live)?.id;
	if (!videoId) return { stream: null, chat: null, past };

	const [watch, player, preview] = await Promise.all([
		innertube(source, 'next', { videoId }),
		innertube(source, 'player', { videoId }).catch(() => null),
		streamPreview(videoId)
	]);

	const info = (
		watch?.contents?.twoColumnWatchNextResults?.results?.results?.contents ?? []
	).find((item: Json) => item?.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
	const views = info?.viewCount?.videoViewCountRenderer;
	const chat = chatOf(watch);

	if (!views?.isLive) return { stream: null, chat, past };

	const started: string | undefined =
		player?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.startTimestamp;
	const viewers = Number(views.originalViewCount) || parseCount(views.viewCount?.runs?.[0]?.text);

	const details = started && viewers ? null : await fetchLiveDetails(videoId);

	return {
		stream: {
			title: (info.title?.runs ?? []).map((run: Json) => run.text).join(''),
			language: '',
			isMature: false,
			createdAt: toDate(started) ?? details?.startedAt ?? null,
			viewers: viewers || details?.viewers || 0,
			preview,
			category: getCategory(watch)
		},
		chat,
		past
	};
}

interface ChannelPage {
	basics: ChannelBasics;
	socials: Socials[];
}

function toSocials(links: Json[] | undefined): Socials[] {
	return (links ?? []).flatMap((item): Socials[] => {
		const link = item?.channelExternalLinkViewModel;
		const shown: string | undefined = link?.link?.content;
		if (!shown) return [];

		try {
			const redirect: string | undefined =
				link.link.commandRuns?.[0]?.onTap?.innertubeCommand?.urlEndpoint?.url;
			const target = redirect ? new URL(redirect).searchParams.get('q') : null;

			const { url, icon } = getFavicon(target ?? shown);

			return [
				{ url, icon, name: new URL(url).hostname, title: link.title?.content || shown }
			];
		} catch {
			return [];
		}
	});
}

function parseJoined(text: string | undefined): Date | null {
	const day = text?.match(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)?.[0];
	return day ? toDate(`${day} UTC`) : null;
}

async function fetchAbout(source: string, header: Json): Promise<Json | null> {
	const panelOf = (holder: Json): string | undefined =>
		holder?.innertubeCommand?.showEngagementPanelEndpoint?.engagementPanel
			?.engagementPanelSectionListRenderer?.content?.sectionListRenderer?.contents?.[0]
			?.itemSectionRenderer?.contents?.[0]?.continuationItemRenderer?.continuationEndpoint
			?.continuationCommand?.token;

	const continuation =
		panelOf(
			header?.description?.descriptionPreviewViewModel?.rendererContext?.commandContext?.onTap
		) ?? panelOf(header?.attribution?.attributionViewModel?.suffix?.commandRuns?.[0]?.onTap);
	if (!continuation) return null;

	const data = await innertube(source, 'browse', { continuation });

	return (
		(data?.onResponseReceivedEndpoints ?? [])
			.flatMap(
				(endpoint: Json) => endpoint?.appendContinuationItemsAction?.continuationItems ?? []
			)
			.find((item: Json) => item?.aboutChannelRenderer)?.aboutChannelRenderer?.metadata
			?.aboutChannelViewModel ?? null
	);
}

async function fetchChannelPage(channelId: string): Promise<ChannelPage | null> {
	const source = '[YouTube] Channel';
	const data = await innertube(source, 'browse', { browseId: channelId });

	const metadata = data?.metadata?.channelMetadataRenderer;
	if (!metadata?.externalId) return null;

	const header = data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
	const headerText = JSON.stringify(header ?? {});

	const about = await fetchAbout(source, header).catch((err): null => {
		log.warn('YouTube', `Could not read the about panel of ${channelId}`, err);
		return null;
	});

	return {
		basics: {
			id: metadata.externalId,
			name: metadata.title,
			description: metadata.description?.trim() || null,
			source: metadata.vanityChannelUrl?.replace(/^http:/, 'https:') ?? channelUrl(channelId),
			avatar: largest(metadata.avatar?.thumbnails) ?? '',
			banner: largest(header?.banner?.imageBannerViewModel?.image?.sources),
			followers: parseCount(
				about?.subscriberCountText ??
					headerText.match(/"content":"([\d.,]+[KMB]? subscribers?)"/)?.[1]
			),
			createdAt: parseJoined(about?.joinedDateText?.content),
			verified: /CHECK_CIRCLE_FILLED|OFFICIAL_ARTIST_BADGE/.test(headerText)
		},
		socials: toSocials(about?.links)
	};
}

async function loadChannelPage(channelId: string): Promise<ChannelPage> {
	let failure: unknown = new ProviderError('[YouTube] Channel', 404);

	try {
		const page = await fetchChannelPage(channelId);
		if (page) return page;
	} catch (err) {
		failure = err;

		if (alternatives().length) {
			log.warn('YouTube', `InnerTube could not provide ${channelId}`, err);
		}
	}

	const basics = await askAlternatives(`the channel ${channelId}`, (api) =>
		api.channel(channelId)
	);
	if (basics) return { basics, socials: [] };

	throw failure;
}

interface PerkEmote {
	id: string;
	name: string;
}

interface PerkBadge {
	id: string;
	months: number;
}

interface Perks {
	channel: User;
	emotes: PerkEmote[];
	badges: PerkBadge[];
	complete: boolean;
}

const perksProfile: CacheProfile = { staleAfter: HOUR, expireAfter: 7 * DAY, allowEmpty: true };
const OWNER_TTL = 30 * DAY;

const perksKey = (channelId: string): string => `youtube:perks:${channelId}`;
const ownerKey = (itemId: string): string => `youtube:owner:${itemId}`;

function toEmotes(emojis: Json[], ownerId: string): PerkEmote[] {
	const emotes = new Map<string, PerkEmote>();

	for (const emoji of emojis) {
		if (typeof emoji?.emojiId !== 'string' || !emoji.emojiId.startsWith(`${ownerId}/`)) {
			continue;
		}

		const id = imageId(largest(emoji.image?.thumbnails) ?? '');
		const name =
			emoji.shortcuts?.[0] ?? (emoji.searchTerms?.[0] && `:${emoji.searchTerms[0]}:`);
		if (!id || !name || emotes.has(id)) continue;

		emotes.set(id, { id, name });
	}

	return [...emotes.values()];
}

function membershipMonths(label: string): number {
	const amount = (unit: string): number =>
		Number(label.match(new RegExp(`(\\d+)\\s*${unit}`, 'i'))?.[1] ?? 0);

	return amount('year') * 12 + amount('month');
}

function badgeTier(months: number): number {
	if (months >= 12) return months - (months % 12);
	return months >= 6 ? 6 : Math.min(months, 2);
}

const byMonths = (a: PerkBadge, b: PerkBadge): number => a.months - b.months;

function toBadges(samples: BadgeSample[]): PerkBadge[] {
	const badges = new Map<string, number>();

	for (const [label, url] of samples) {
		const id = imageId(url);
		if (!id) continue;

		const months = badgeTier(membershipMonths(label));
		badges.set(id, Math.min(months, badges.get(id) ?? Infinity));
	}

	return [...badges].map(([id, months]) => ({ id, months })).sort(byMonths);
}

function mergeBadges(known: PerkBadge[], seen: PerkBadge[]): PerkBadge[] {
	const badges = new Map(known.map((badge) => [badge.id, badge.months]));

	for (const { id, months } of seen) {
		const before = badges.get(id);

		if (before === undefined) {
			for (const [other, value] of badges) {
				if (value === months) badges.delete(other);
			}
		}

		badges.set(id, Math.min(months, before ?? Infinity));
	}

	return [...badges].map(([id, months]) => ({ id, months })).sort(byMonths);
}

const badgePoint = (position: number): number =>
	position < 4 ? [0, 1, 2, 6][position] : 12 * (position - 3);
const ALL_BADGES = 9;

function placeBadges(offered: string[], seen: PerkBadge[]): PerkBadge[] {
	const months = new Map(seen.map((badge) => [badge.id, badge.months]));
	const exact = offered.length >= ALL_BADGES;
	let position = 0;

	return offered.map((id) => {
		const known = exact ? undefined : months.get(id);

		while (known !== undefined && badgePoint(position) < known) position++;

		return { id, months: badgePoint(position++) };
	});
}

async function fetchOfferedBadges(channelId: string): Promise<string[] | null> {
	const source = '[YouTube] Memberships';
	const session = sessionHeaders();
	if (!session) return null;

	try {
		const page = await innertube(source, 'browse', { browseId: channelId }, session);

		if (page?.responseContext?.mainAppWebResponseContext?.loggedOut) {
			log.warn('YouTube', 'The session of `youtube.cookie` is no longer signed in');
			return null;
		}

		const [offer] = descend(page, 'ypcGetOffersEndpoint');
		if (typeof offer?.params !== 'string') return null;

		const offers = await innertube(
			source,
			'ypc/get_offers',
			{ itemParams: offer.params },
			session
		);

		for (const perk of descend(offers, 'sponsorshipsPerkRenderer')) {
			const images: Json[] = Array.isArray(perk?.images) ? perk.images : [];
			const labels = images.map((item) => item?.accessibility?.accessibilityData?.label);

			if (!/badge/i.test(labels[0] ?? '') || labels.some((label) => label !== labels[0])) {
				continue;
			}

			const ids = images.flatMap((item): string[] => {
				const id = imageId(largest(item?.thumbnails) ?? '');
				return id ? [id] : [];
			});

			return [...new Set(ids)];
		}

		log.warn('YouTube', `The membership offer of ${channelId} lists no badges`);
		return null;
	} catch (err) {
		log.warn('YouTube', `Could not get the membership offer of ${channelId}`, err);
		return null;
	}
}

async function loadPerks(
	channelId: string,
	page: Promise<ChannelPage>,
	lookup: Promise<StreamLookup>,
	uploads: Promise<Video[]>
): Promise<Perks> {
	const offered = fetchOfferedBadges(channelId);

	const comments = Promise.all([uploads, lookup]).then(([videos, { past }]) =>
		Promise.all([...aired(videos), ...past].slice(0, COMMENT_VIDEOS).map(readComments))
	);

	const chats = Promise.all([lookup, offered]).then(([{ chat, past }, badges]) =>
		(badges?.length ?? 0) >= ALL_BADGES ? [] : sampleChats(chat, past)
	);

	const [{ basics }, previous, offeredBadges, commentSamples, chatSamples] = await Promise.all([
		page,
		peek<Perks>(perksKey(channelId)),
		offered,
		comments,
		chats
	]);

	const samples = [...commentSamples.filter((sample) => sample !== null), ...chatSamples];
	const picker = commentSamples.find((sample) => sample !== null);

	const emotes = toEmotes(
		[...(picker?.emojis ?? []), ...chatSamples.flatMap(({ emojis }) => emojis)],
		channelId
	);

	const seen = toBadges(samples.flatMap(({ badges }) => badges));

	const perks: Perks = {
		channel: {
			id: basics.id,
			username: basics.name,
			avatar: basics.avatar || undefined,
			source: basics.source,
			platform: 'youtube'
		},
		emotes: picker
			? emotes
			: [...new Map([...(previous?.emotes ?? []), ...emotes].map((e) => [e.id, e])).values()],
		badges: offeredBadges?.length
			? placeBadges(offeredBadges, seen)
			: mergeBadges(previous?.badges ?? [], seen),
		complete: !!offeredBadges?.length
	};

	await indexPerks(perks);

	return perks;
}

function indexPerks(perks: Perks): Promise<void> {
	return storeAll(
		new Map(
			[...perks.emotes, ...perks.badges].map(({ id }) => [ownerKey(id), perks.channel.id])
		),
		OWNER_TTL
	);
}

async function ensureIndexed(perks: Perks): Promise<void> {
	const first = perks.emotes[0] ?? perks.badges[0];

	if (first && !(await peek<string>(ownerKey(first.id)))) {
		log.info('YouTube', `Indexing the emojis and badges of ${perks.channel.id} again`);
		await indexPerks(perks);
	}
}

const listUploads = (channelId: string): Promise<Video[]> =>
	listVideos(channelId, TAB_VIDEOS).catch((err): Video[] => {
		log.debug('YouTube', `Could not list the videos of ${channelId}`, err);
		return [];
	});

function getPerks(
	channelId: string,
	known?: {
		page: Promise<ChannelPage>;
		lookup: Promise<StreamLookup>;
		uploads: Promise<Video[]>;
	}
): Promise<Perks> {
	return cached(perksKey(channelId), perksProfile, () =>
		loadPerks(
			channelId,
			known?.page ?? loadChannelPage(channelId),
			known?.lookup ?? findStream(channelId).catch(() => noStream),
			known?.uploads ?? listUploads(channelId)
		)
	);
}

async function findPerks(itemId: string): Promise<Perks | null> {
	try {
		const channelId = await peek<string>(ownerKey(itemId));
		return channelId ? await getPerks(channelId) : null;
	} catch (err) {
		log.warn('YouTube', `Could not get the channel of ${itemId}`, err);
		return null;
	}
}

const membershipName = (i18n: Translator, months: number): string =>
	i18n.t('badge.youtube.membership', { count: months });

const toBadgeList = (badges: PerkBadge[], i18n: Translator): Badges[] =>
	badges.map(({ id, months }) => ({
		id,
		title: membershipName(i18n, months),
		version: '',
		description: null,
		image: badgeImage(id, 64),
		type: 'MEMBERS',
		provider: 'youtube'
	}));

const toEmoteList = (emotes: PerkEmote[]): Emotes[] =>
	emotes.map(({ id, name }) => ({
		id,
		name,
		image: emoteImage(id, 96),
		owner: null,
		provider: 'youtube'
	}));

interface ChannelSnapshot extends ChannelPage {
	stream: StreamInfo | null;
	offline: OfflineInfo | null;
	perks: Perks | null;
}

async function loadChannel(channelId: string): Promise<ChannelSnapshot> {
	const page = loadChannelPage(channelId);
	const lookup = findStream(channelId).catch((err): StreamLookup => {
		log.warn('YouTube', `Could not look for the stream of ${channelId}`, err);
		return noStream;
	});

	const uploads = listUploads(channelId);

	const [{ basics, socials }, { stream }, videos, perks] = await Promise.all([
		page,
		lookup,
		uploads,
		getPerks(channelId, { page, lookup, uploads }).catch((err): null => {
			log.warn('YouTube', `Could not get the membership perks of ${channelId}`, err);
			return null;
		})
	]);

	const latest = videos.find((video) => !video.live && !video.upcoming);
	const offline: OfflineInfo | null = latest
		? {
				title: latest.title,
				image: latest.thumbnail ?? `https://i.ytimg.com/vi/${latest.id}/hqdefault.jpg`
			}
		: null;

	return { basics, socials, stream, offline, perks };
}

export async function getYouTubeChannel(channel: string, i18n: Translator): Promise<ChannelData> {
	const channelId = await resolveYouTubeChannelId(channel);

	const { basics, socials, stream, offline, perks } = await cached(
		`youtube:channel:${channelId}`,
		profiles.live,
		() => loadChannel(channelId)
	);

	if (perks) await ensureIndexed(perks);

	return {
		provider: 'youtube',
		source: basics.source,
		user: {
			id: basics.id,
			color: '#666666',
			backgroundColor: '#0f0f0f',
			createdAt: basics.createdAt,
			bio: basics.description,
			username: basics.name,
			slug: basics.id,
			followers: basics.followers,
			roles: {
				isAffiliate: false,
				isPartner: basics.verified,
				isStaff: false
			},
			socials,
			badge: null,
			images: {
				avatar: basics.avatar,
				banner: basics.banner
			},
			stream,
			offline: offline ?? null
		},
		content: {
			follower: { emotes: [], badges: [] },
			sub: {
				title: null,
				emotes: toEmoteList(perks?.emotes ?? []),
				badges: toBadgeList(perks?.badges ?? [], i18n)
			},
			subT2: null,
			subT3: null,
			bits: { emotes: [], badges: [] },
			special: { emotes: [], badges: [] },
			campaign: { emotes: [], badges: [] }
		}
	};
}

async function requireImage(source: string, url: string): Promise<void> {
	await cached(`youtube:image:${url}`, profiles.static, async () => {
		if (!(await exists(url))) throw new ProviderError(source, 404);
		return true;
	});
}

export async function getYouTubeEmote(emoteId: string, ctx: EmoteContext): Promise<Emote> {
	const { global } = ctx;

	const perks = global ? null : await findPerks(emoteId);
	const known = perks?.emotes.find((emote) => emote.id === emoteId);

	if (!global && !known) await requireImage('[YouTube] Emote', emoteImage(emoteId, 48));

	const owner = global ? youtubeOwner : known && perks ? perks.channel : null;

	return {
		id: emoteId.toString(),
		name: global?.name ?? known?.name ?? '',
		provider: 'youtube',
		tags: [],
		artist: null,
		owner,
		images: [24, 48, 96].map((size) => emoteImage(emoteId, size)),
		source: owner && !global ? `${channelUrl(owner.id as string)}/join` : 'https://youtube.com',
		createdAt: null,
		approved: true,
		type: global ? 'GLOBALS' : known ? 'MEMBERS' : 'CHANNEL',
		public: true,
		animated: false,
		global: !!global,
		deleted: false,
		channels: {
			total: 0,
			list: []
		}
	};
}

function bundledGlobalEmotes(): Emotes[] {
	return Globals.map((emoji) => ({
		id: emoji.id.toString(),
		name: emoji.name,
		image: emoji.image,
		owner: null,
		provider: 'youtube'
	}));
}

export async function getYouTubeGlobalEmotes(): Promise<Emotes[]> {
	try {
		const videos = await listVideos(YOUTUBE_CHANNEL, TAB_VIDEOS);

		for (const videoId of aired(videos).slice(0, COMMENT_VIDEOS)) {
			const comments = await readComments(videoId);
			const emotes = toEmoteList(toEmotes(comments?.emojis ?? [], GLOBAL_EMOJIS));

			if (emotes.length) return emotes;
		}

		log.warn('YouTube', 'The global emojis were not listed, using the bundled copy');
	} catch (err) {
		log.warn('YouTube', 'Could not get the global emojis, using the bundled copy', err);
	}

	return bundledGlobalEmotes();
}

export async function getYouTubeBadge(badgeId: string, ctx: BadgeContext): Promise<Badge> {
	const { i18n } = ctx;
	const [id] = badgeId.split('/');

	const perks = await findPerks(id);
	const known = perks?.badges.find((badge) => badge.id === id);

	if (!known) await requireImage('[YouTube] Badge', badgeImage(id, 64));

	const owner = known && perks ? perks.channel : null;
	const related = known && perks ? perks.badges.filter((badge) => badge.id !== id) : [];

	return {
		id,
		name: known ? membershipName(i18n, known.months) : i18n.t('badge.youtube.member'),
		provider: 'youtube',
		owner,
		images: [16, 32, 64].map((size) => badgeImage(id, size)),
		description: null,
		version: '',
		related: { total: related.length, list: toBadgeList(related, i18n) },
		setId: null,
		type: 'MEMBERS',
		global: false,
		source: owner ? `${channelUrl(owner.id as string)}/join` : null,
		createdAt: null
	};
}
