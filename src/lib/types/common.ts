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
	zeroWidth?: boolean;
}

export interface EmotePage {
	id: string;
	emote: Emote | null;
	error?: string;
	provider: string;
	pageTitle: string;
	pageImage: string;
}

export interface Emotes {
	id: string;
	name: string;
	image: string;
	owner: string | null;
	zeroWidth?: boolean;
	bitsCost?: number;
	provider: string;
}

export interface SetPage {
	id: string;
	set: Set | null;
	error?: string;
	provider: string;
	pageTitle: string;
	pageImage: string;
}

export interface Set {
	id: string;
	name: string | null;
	subtitle: string | null;
	mainSet?: boolean;
	tags: string[];
	owner: User | null;
	emotes: Emotes[];
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

export interface ChannelPage {
	id: string;
	channel: ChannelData | null;
	error?: string;
	provider: string;
	pageTitle: string;
	pageImage: string;
}

export interface ChannelData {
	provider: string;
	source: string;
	user: UserData;
	content: ChannelContent;
}

export interface ChannelContent {
	follower: EmoteBadge;
	bits: EmoteBadge;
	sub: SubTier | null;
	subT2: SubTier | null;
	subT3: SubTier | null;
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

export interface UserData {
	id: string;
	color: string | null;
	backgroundColor: string;
	createdAt: Date;
	bio: string | null;
	username: string;
	roles: Roles;
	followers: number;
	socials: Socials[];
	badge: { id: string; title: string; version: string; image: string } | null;
	images: { avatar: string; banner: string | null; offline: string | null };
	stream: StreamInfo | null;
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
	createdAt: Date;
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
	provider: string;
}

export interface Extras {
	createdAt: Date | null;
	deletedAt: Date | null;
	artist?: User | null;
	image?: string | null;
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
	source: string | null;
	createdAt: Date | null;
}

export interface BadgePage {
	id: string;
	badge: Badge | null;
	error?: string;
	provider: string;
	pageTitle: string;
	pageImage: string;
}

export type Platforms = 'twitch' | 'youtube';

export type Theme = 'dark' | 'light' | 'system' | null;
