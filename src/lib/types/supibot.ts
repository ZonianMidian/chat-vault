export interface Origin {
	statusCode: number;
	timestamp: number;
	data: OriginData[];
	error: null;
}

export interface OriginData {
	ID: number;
	emoteId?: string | null;
	name: string;
	tier: null | string;
	raffle: Date | null;
	todo: boolean;
	type: string;
	text: string;
	emoteAdded: Date | null;
	emoteDeleted: Date | null;
	recordAdded: Date;
	notes: null | string;
	replaced: boolean;
	authorName?: null | string;
	reporterName?: null | string;
	raffleWinnerName?: null | string;
	url: string;
	emoteID?: string | null;
	artist?: null | string;
	reporter?: null | string;
}

export interface Data {
	ID: number;
	emoteID: string | null;
	name: string;
	type: string;
	tier: number | null;
	origin: string | null;
	text: string;
	emoteAdded: Date | null;
	emoteDeleted: Date | null;
	notes: null | string;
	artist: null | string;
	reporter: string | null;
	url: string;
}

export type Type =
	| 'Twitch - Sub'
	| 'FFZ - Channel'
	| 'Twitch - Global'
	| 'BTTV - Channel'
	| 'BTTV - Global'
	| 'Other'
	| 'FFZ - Global'
	| '7TV - Channel'
	| 'Twitch - Bits'
	| 'Twitch - Other'
	| 'Twitch - Follower'
	| '7TV - Global';
