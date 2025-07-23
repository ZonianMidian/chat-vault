export interface EmoteRequest {
	data: EmoteData;
}

export interface BadgeRequest {
	data: BadgeData;
}

export interface EmoteData {
	_id: string;
	current: CurrentEmote;
	history: EmoteHistory[];
	added: boolean;
	contexts: Context[];
}

export interface BadgeData {
	_id: string;
	current: CurrentBadge;
	history: BadgeHistory[];
	added: boolean;
	user_count: UserCount;
	contexts: Context[];
}

export interface CurrentEmote {
	id: string;
	name: string;
	images: EmoteImages;
	format: string[];
	scale: string[];
	theme_mode: string[];
}

export interface CurrentBadge {
	set_id: string;
	version: BadgeVersion;
}

export interface EmoteHistory {
	type: string;
	timestamp: Date | null;
	_id: string;
	entries?: EmoteEntries;
}

export interface BadgeHistory {
	type: string;
	timestamp: Date | null;
	entries?: BadgeEntries;
	_id: string;
}

export interface EmoteEntries {
	id: string;
	name: string;
	'images.url_1x': string;
	'images.url_2x': string;
	'images.url_4x': string;
	'format.0': string;
	'scale.0': string;
	'scale.1': string;
	'scale.2': string;
	'theme_mode.0': string;
	'theme_mode.1': string;
}

export interface BadgeEntries {
	set_id: string;
	'version.id': string;
	'version.image_url_1x': string;
	'version.image_url_2x': string;
	'version.image_url_4x': string;
	'version.title': string;
	'version.description': string;
	'version.click_action': null;
	'version.click_url': null;
}

export interface Context {
	_id: string;
	doc: string;
	docModel: string;
	content?: string;
	pending_content?: string;
	created_by: CreatedBy;
	downvotes: number;
	tags: string[];
	upvotes: number;
}

export interface CreatedBy {
	_id: string;
	twitch: Twitch;
}

export interface Twitch {
	user: User;
}

export interface User {
	display_name: string;
	login: string;
}

export interface BadgeVersion {
	id: string;
	image_url_1x: string;
	image_url_2x: string;
	image_url_4x: string;
	title: string;
	description: string;
	click_action: string | null;
	click_url: string | null;
}

export interface EmoteImages {
	url_1x: string;
	url_2x: string;
	url_4x: string;
}

export interface UserCount {
	current: number;
}
