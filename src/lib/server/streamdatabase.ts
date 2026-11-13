import type { Origin } from '#lib/types/common.ts';

import { ProviderError, requestJson } from '#lib/server/http.ts';

const API = 'https://api.streamdatabase.com';

const models = {
	'global-emotes': 'TwitchGlobalEmote',
	'global-badges': 'TwitchGlobalBadge',
	'channel-badges': 'TwitchChannelBadge'
} as const;

export type StreamDatabaseCollection = keyof typeof models;

interface HistoryEntry {
	type: 'added' | 'removed' | 'started_tracking_history' | (string & {});
	timestamp: string | null;
}

interface RecordResponse {
	data?: {
		_id: string;
		added?: boolean;
		removed?: boolean;
		history?: HistoryEntry[];
	};
}

interface Context {
	_id: string;
	doc: string;
	docModel: string;
	content?: string;
	pending_content?: string;
	user?: { twitch?: { user?: { display_name?: string; login?: string } } };
	upvote_count?: number;
	downvote_count?: number;
}

interface ContextsResponse {
	data?: Context[];
}

export interface StreamDatabaseInfo {
	createdAt: Date | null;
	deletedAt: Date | null;
	origin: Origin | null;
}

const score = (context: Context) => (context.upvote_count ?? 0) - (context.downvote_count ?? 0);

async function fetchContext(
	collection: StreamDatabaseCollection,
	recordId: string
): Promise<Context | null> {
	try {
		const { data } = await requestJson<ContextsResponse>(
			'[StreamDatabase] Context',
			`${API}/v1/contexts/${models[collection]}/${recordId}`
		);

		if (!Array.isArray(data)) return null;

		return data.toSorted((a, b) => score(b) - score(a))[0] ?? null;
	} catch (err) {
		if (err instanceof ProviderError) return null;
		throw err;
	}
}

export async function fetchStreamDatabase(
	collection: StreamDatabaseCollection,
	id: string
): Promise<StreamDatabaseInfo | null> {
	const path = `${collection}/${id}`;
	let data: RecordResponse['data'];

	try {
		data = (await requestJson<RecordResponse>('[StreamDatabase]', `${API}/twitch/${path}`))
			.data;
	} catch (err) {
		if (err instanceof ProviderError) return null;
		throw err;
	}

	if (!data) return null;

	const history = data.history ?? [];
	const dateOf = (entry: HistoryEntry | undefined) =>
		entry?.timestamp ? new Date(entry.timestamp) : null;

	const createdAt = dateOf(history.find((entry) => entry.type === 'added'));

	const isRemoved = data.added === false || data.removed === true;
	const deletedAt = isRemoved
		? dateOf(history.findLast((entry) => entry.type === 'removed'))
		: null;

	const context = data._id ? await fetchContext(collection, data._id) : null;
	const text = context?.pending_content || context?.content;
	const author = context?.user?.twitch?.user;

	return {
		createdAt,
		deletedAt,
		origin: text
			? {
					source: `https://streamdatabase.com/twitch/${path}`,
					provider: 'StreamDatabase',
					text,
					artist: author ? author.display_name || author.login || null : null
				}
			: null
	};
}
