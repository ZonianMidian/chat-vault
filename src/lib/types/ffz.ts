export interface FFZEmote {
	templates?: Templates;
	emote?: Emote;
	status?: number;
	error?: string;
	message?: string;
}

export interface Emote {
	id: number;
	created_at: Date;
	updated_at: Date;
	name: string;
	width: number;
	height: number;
	scales: number[];
	public: boolean;
	hidden: boolean;
	use_count: number;
	status: number;
	deleted: boolean;
	animated: boolean;
	mask: boolean;
	mask_animated: boolean;
	modifier: boolean;
	modifier_flags: number;
	offset: null;
	margins: null;
	css: null;
	owner: User;
	artist?: User;
}

export interface FFZGlobals {
	default_sets: number[];
	sets: { [key: string]: Emotes };
}

export interface Emotes {
	id: number;
	_type: number;
	icon: null;
	title: string;
	css: null;
	emoticons: Emote[];
}

export interface FFZSet {
	templates: Templates;
	collection: Collection;
	pages: number;
	total: number;
	emotes: Emote[];
}

export interface Collection {
	id: number;
	created_at: Date;
	updated_at: Date;
	type: string;
	icon: null;
	title: string;
	description: null;
	count: number;
	owner: User;
}

export interface User {
	_id: number;
	id: number;
	provider: string;
	provider_id: string;
	name: string;
	display_name: string;
}

export interface Templates {
	static: string;
	animated: string;
}

export interface FFZUser {
	room: Room;
	sets: { [key: string]: Emotes };
}

export interface Room {
	_id: number;
	twitch_id: number;
	youtube_id: null;
	id: string;
	is_group: boolean;
	display_name: string;
	set: number;
	moderator_badge: null | string;
	vip_badge: { [key: string]: string } | null;
	mod_urls: { [key: string]: string } | null;
	user_badges: UserBadges;
	user_badge_ids: UserBadgeIDS;
	css: null;
}

export interface UserBadgeIDS {
	'2'?: number[];
}

export interface UserBadges {
	'2'?: string[];
}
