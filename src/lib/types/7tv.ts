export interface STVEmote {
	id: string;
	name: string;
	tags: string[];
	flags: number;
	listed: boolean;
	animated: boolean;
	created_at: Date;
	personal_use: boolean;
	owner: STVChannel;
	channels: Channels;
	data: {
		owner?: STVChannel;
		flags?: number;
	};
}

export interface STVSet {
	id: string;
	name: string;
	flags: number;
	tags: any[];
	immutable: boolean;
	privileged: boolean;
	emotes: STVEmote[];
	emote_count: number;
	capacity: number;
	owner: STVChannel;
}

export interface Channels {
	total: number;
	items: STVChannel[];
}

export interface STVChannel {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string;
	emote_sets: STVSet[];
	connections: Connection[];
}

export interface Connection {
	id: string;
	platform: Platform;
	username: string;
	display_name: string;
	emote_set_id: string;
}

export type Platform = 'TWITCH' | 'KICK' | 'DISCORD' | 'YOUTUBE';

export interface Error {
	message: string;
	locations: Location[];
	path: string[];
}

export interface Location {
	line: number;
	column: number;
}
