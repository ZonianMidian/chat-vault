export interface TwitchEmote {
	channelID?: string;
	channelLogin?: string;
	channelName?: string;
	emoteID: string;
	emoteCode: string;
	emotePrefix: string;
	emoteSuffix: string;
	emoteURL: string;
	emoteSetID: string;
	emoteAssetType: AssetType;
	artist?: Artist | null;
	emoteTier?: number;
	source?: string;
	emoteBitCost?: number;
	emoteState: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED' | 'DELETED';
	emoteType:
		| 'SUBSCRIPTIONS'
		| 'ARCHIVE'
		| 'SMILIES'
		| 'BITS_BADGE_TIERS'
		| 'PRIME'
		| 'TURBO'
		| 'GLOBALS'
		| 'TWO_FACTOR'
		| 'LIMITED_TIME'
		| 'MEGA_COMMERCE'
		| 'HYPE_TRAIN'
		| 'FOLLOWER';
}

export interface TwitchSet {
	setID: string;
	channelName: string | null;
	channelID: string | null;
	channelLogin: string | null;
	tier: string | null;
	emoteList: EmoteList[];
}

export interface EmoteList {
	code: string;
	id: string;
	artist: Artist | null;
	type: string;
	assetType: AssetType;
}

export interface Artist {
	id: string;
	login: string;
	displayName: string;
}

export interface TwitchUser {
	id: string;
	login: string;
	chatColor: string | null;
	createdAt: Date;
	description: string | null;
	displayName: string;
	bannerImageURL: null | string;
	primaryColorHex: string | null;
	offlineImageURL: null | string;
	profileImageURL: string;
	roles: Roles;
	followers: {
		count: number;
	};
	selectedBadge: SelectedBadge | null;
	stream: Stream | null;
	broadcastBadges: TwitchBadge[];
	cheer: Cheer | null;
	subEmotes: SubEmote[];
	channel: Channel;
}

export interface Roles {
	isAffiliate: boolean;
	isPartner: boolean;
	isStaff: boolean | null;
}

export interface SelectedBadge {
	title: string;
	setID: string;
	version: string;
	image_url_1x: string;
	image_url_2x: string;
	image_url_4x: string;
}

export interface Stream {
	title: string;
	language: string;
	isMature: boolean;
	createdAt: Date;
	viewersCount: number;
	lastUpdatedAt: null;
	previewImageURL: string;
	game: Game | null;
}

export interface Game {
	slug: string;
	boxArt: string;
	displayName: string;
}

export interface TwitchBadge {
	id: string;
	title: string;
	setID: string;
	version: string;
	clickURL: null | string;
	description: string;
	onClickAction: string | null; // SUBSCRIBE // VISIT_URL
	image_url_1x: string;
	image_url_2x: string;
	image_url_4x: string;
}

export interface Cheer {
	badgeTierEmotes: GQLEmote[];
}

export interface GQLEmote {
	id: string;
	type: string; // BITS_BADGE_TIERS // FOLLOWER // SUBSCRIPTIONS
	setID: string;
	assetType: AssetType;
	code: string;
	artist?: Artist | null;
	bits?: {
		cost: number;
	};
}

export interface Channel {
	socialMedias: SocialMedia[];
	creatorBadgeFlair: CreatorBadgeFlair;
	localEmoteSets: LocalEmoteSet[] | null;
}

export interface SocialMedia {
	url: string;
	name: string;
	title: string;
}

export interface CreatorBadgeFlair {
	assets: Asset[];
}

export interface LocalEmoteSet {
	id: string;
	localEmotes: GQLEmote[];
}

export interface Asset {
	tier: string; // TIER_2 // TIER_3
	image_url_1x: string;
	image_url_2x: string;
	image_url_4x: string;
}

export interface SubEmote {
	tier: string;
	emoteSetID: string;
	displayName: string;
	emotes: GQLEmote[];
}

export interface Badge {
	setID: string;
	title: string;
	description: string;
	version: string;
}

export interface ChatSettings {
	chatDelayMs: number;
	followersOnlyDurationMinutes: number | null;
	slowModeDurationSeconds: number | null;
	blockLinks: boolean;
	isSubscribersOnlyModeEnabled: boolean;
	isEmoteOnlyModeEnabled: boolean;
	isFastSubsModeEnabled: boolean;
	isUniqueChatModeEnabled: boolean;
	requireVerifiedAccount: boolean;
	rules: string[];
}

export interface LastBroadcast {
	startedAt: Date | null;
	title: null | string;
}

export interface Panel {
	id: string;
}

export enum AssetType {
	Animated = 'ANIMATED',
	Static = 'STATIC'
}
