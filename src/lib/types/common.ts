export interface Emote {
	id: string;
	name: string;
	provider: string;
	source: string | null;
	owner: User | null;
	images: string[];
	altImage?: string | null;
	setId?: string;
	tags: string[];
	artist: User | null;
	channels: Channels;
	createdAt: Date | null;
	deletedAt?: Date | null;
	type: string | null;
	approved: boolean;
	public: boolean;
	animated: boolean;
	zero_width?: boolean;
	tier?: number | null;
	cost?: number | null;
	global: boolean;
	deleted: boolean;
}

export interface Emotes {
	id: string;
	name: string;
	image: string;
	owner: string | null;
	zero_width?: boolean;
	value?: string;
	type?: string | null;
	provider: string;
}

export interface Set {
	id: string;
	name: string | null;
	subtitle: string | null;
	mainSet?: boolean;
	tags: string[];
	owner: User | null;
	emotes: Emotes[];
	tier?: string | null;
	source: string;
	provider: string;
}

export interface User {
	id?: string;
	username: string | null;
	avatar?: string;
	platform: Platforms | 'kick';
	source: string;
}

export interface Channel {
	id: string;
	username: string;
	avatar: string;
	platform: Platforms | 'kick';
	posId?: string;
}

export interface ChannelData {
	provider: string;
	source: string;
	user: UserData;
	content: ChannelContent;
}

export interface ChannelContent {
	follower: EmoteBadge;
	sub: SubTier | null;
	subT2: SubTier | null;
	subT3: SubTier | null;
	bits: EmoteBadge;
	special: EmoteBadge;
	campaign: EmoteBadge;
	points?: ChannelPoints;
}

export interface EmoteBadge {
	emotes: Emotes[];
	badges: Badges[];
}

export interface SubTier {
	title: string | null;
	emotes: Emotes[];
	flair?: string;
	badges: Badges[];
}

export interface ChannelPoints {
	name: string;
	image: string;
}

export interface UserData {
	id: string;
	color: string | null;
	backgroundColor: string;
	createdAt: Date | null;
	bio: string | null;
	username: string;
	slug: string;
	roles: Roles;
	followers: number;
	socials: Socials[];
	badge: { id: string; title: string; version: string; image: string } | null;
	images: { avatar: string; banner: string | null };
	stream: StreamInfo | null;
	offline: OfflineInfo | null;
}

export interface OfflineInfo {
	title: string | null;
	image: string | null;
}

export interface Socials {
	url: string;
	name: string;
	title: string;
	icon: string;
}

export interface Roles {
	isAffiliate: boolean;
	isPartner: boolean;
	isStaff: boolean | null;
}

export interface StreamInfo {
	title: string;
	language: string;
	isMature: boolean;
	createdAt: Date | null;
	viewers: number;
	preview: string;
	category: CategoryInfo | null;
}

export interface CategoryInfo {
	url: string;
	name: string;
	boxArt: string | null;
}

export interface Badges {
	id: string;
	title: string;
	value?: string;
	version: string;
	description: string | null;
	clickAction?: string | null;
	clickURL?: string | null;
	image: string;
	tier?: number | null;
	type?: string | null;
	provider: string;
}

export interface Extras {
	createdAt: Date | null;
	deletedAt: Date | null;
	artist?: User | null;
	image?: string | null;
	tier?: number | null;
	cost?: number | null;
	type?: string | null;
	related: {
		total: number;
		list: Emotes[] | Badges[];
	};
	origin: Origin[];
}

export interface Origin {
	source: string;
	provider: string;
	text: string;
	notes?: string | null;
	artist: string | null;
}

export interface Variant {
	id: string;
	image: string;
	name: string;
	variant: string;
	provider: string;
}

export interface Channels {
	total: number;
	list: Channel[];
}

export interface Sizes {
	width: number | null;
	height: number | null;
	size: string | null;
	objectUrl: string;
}

export interface ChannelProvider {
	provider: string;
	bots: string[];
	sets: Set[];
}

export interface Badge {
	id: string;
	name: string;
	provider: string;
	owner: User | null;
	images: string[];
	setId: string | null;
	version: string;
	description: string | null;
	clickAction?: string | null;
	clickURL?: string | null;
	related: { total: number; list: Badges[] };
	cost?: number;
	tier?: number;
	source: string | null;
	type?: string | null;
	global: boolean;
	createdAt: Date | null;
}

export interface LocaleInfo {
	code: string;
	language: string;
}

export type Platforms = 'twitch' | 'youtube';

export type Theme = 'dark' | 'light' | 'system' | null;

export const typeLabels: Record<string, string> = {
	BITS_BADGE_TIERS: 'set.bits',
	CHANNEL_POINTS: 'channel.points',
	MEGA_COMMERCE: 'emote.info.type.hype_train',
	SPECIAL_EVENT: 'set.special_events',
	SUBSCRIPTIONS: 'set.sub',
	LIMITED_TIME: 'emote.info.type.limited_time',
	SUB_OR_GIFT: 'badge.info.type.sub_or_gift',
	HYPE_TRAIN: 'emote.info.type.hype_train',
	TWO_FACTOR: 'emote.info.type.2fa',
	WATCHTIME: 'badge.info.type.watchtime',
	FOLLOWER: 'set.follower',
	ARCHIVE: 'emote.info.type.archive',
	SMILIES: 'emote.info.type.smilies',
	MEMBERS: 'badge.youtube.member',
	CHANNEL: 'channel.label',
	GLOBALS: 'set.global',
	PRIME: 'emote.info.type.prime',
	TURBO: 'emote.info.type.turbo',
	FLAIR: 'common.flair'
};
