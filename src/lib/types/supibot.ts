export interface Origin {
	statusCode: number;
	timestamp: number;
	data: OriginData[];
	error: null;
}

export interface OriginData {
	ID: number;
	emoteID: string;
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
	artist: null | string;
	reporter: string;
	raffleWinner: null | string;
	detailUrl: null | string;
	url: string;
}

export interface Data {
	ID: number;
	emoteID: string;
	name: string;
	type: string;
	tier: number | null;
	origin: string | null;
	text: string;
	emoteAdded: Date | null;
	emoteDeleted: Date | null;
	notes: null | string;
	artist: null | string;
	reporter: string;
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
	| '7TV - Global';
