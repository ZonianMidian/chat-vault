export interface KickUser {
	id: number;
	user_id: number;
	slug: string;
	is_banned: boolean;
	playback_url: string;
	name_updated_at: Date | null;
	vod_enabled: boolean;
	subscription_enabled: boolean;
	is_affiliate: boolean;
	followersCount: number;
	subscriber_badges: SubscriberBadge[];
	banner_image: BannerImage | null;
	recent_categories: Category[];
	livestream: Livestream | null;
	role: null;
	muted: boolean;
	follower_badges: any[];
	offline_banner_image: OfflineBannerImage | null;
	can_host: boolean;
	user: UserData;
	chatroom: Chatroom;
	ascending_links: AscendingLink[];
	plan: Plan | null;
	previous_livestreams: PreviousLivestream[];
	verified: Verified | null;
	media: Media[];
}

export interface AscendingLink {
	id: number;
	channel_id: number;
	description: string;
	link: string;
	created_at: Date;
	updated_at: Date;
	order: number;
	title: string;
}

export interface BannerImage {
	responsive: string;
	url: string;
}

export interface Chatroom {
	id: number;
	chatable_type: string; // "App\\Models\\Channel";
	channel_id: number;
	created_at: Date;
	updated_at: Date;
	chat_mode_old: ChatMode;
	chat_mode: ChatMode;
	slow_mode: boolean;
	chatable_id: number;
	followers_mode: boolean;
	subscribers_mode: boolean;
	emotes_mode: boolean;
	message_interval: number;
	following_min_duration: number;
}

export enum ChatMode {
	Public = 'public',
	SubscribersOnly = 'subscribers_only'
}

export interface Livestream {
	id: number;
	slug: string;
	channel_id: number;
	created_at: string;
	session_title: string;
	is_live: boolean;
	risk_level_id: null;
	start_time: Date;
	source: null;
	twitch_channel: null;
	duration: number;
	language: string;
	is_mature: boolean;
	viewer_count: number;
	thumbnail: BannerImage;
	viewers: number;
	lang_iso: string;
	tags: string[];
	categories: Category[];
}

export interface Category {
	id: number;
	category_id: number;
	name: string;
	slug: string;
	tags: string[];
	description: null | string;
	deleted_at: null;
	is_mature: boolean;
	is_promoted: boolean;
	viewers: number;
	category: RecentCategory;
	banner?: BannerImage;
}

export interface RecentCategory {
	id: number;
	name: Name;
	slug: Slug;
	icon: Icon;
}

export enum Icon {
	Empty = '\ud83c\udf99️',
	Fluffy = '\ud83d\udc7d',
	Icon = '\ud83c\udfa8',
	Purple = '\ud83c\udfb9',
	Sticky = '\ud83c\udfb0',
	Tentacled = '\ud83d\udd79️'
}

export enum Name {
	Alternative = 'Alternative',
	Creative = 'Creative',
	Gambling = 'Gambling',
	Games = 'Games',
	Irl = 'IRL',
	Music = 'Music'
}

export enum Slug {
	Alternative = 'alternative',
	Creative = 'creative',
	Gambling = 'gambling',
	Games = 'games',
	Irl = 'irl',
	Music = 'music'
}

export interface Media {
	id: number;
	model_type: string; // "App\\Models\\Channel";
	model_id: number;
	collection_name: CollectionName;
	name: string;
	file_name: string;
	mime_type: string;
	disk: string; // "s3";
	size: number;
	manipulations: any[];
	custom_properties: CustomProperties;
	responsive_images: any[] | ResponsiveImagesClass;
	order_column: number;
	created_at: Date;
	updated_at: Date;
	uuid: string;
	conversions_disk: string; // "s3";
}

export enum CollectionName {
	BannerImage = 'banner_image',
	OfflineBanner = 'offline_banner'
}

export interface CustomProperties {
	generated_conversions: GeneratedConversions;
}

export interface GeneratedConversions {
	fullsize: boolean;
	medium?: boolean;
}

export interface ResponsiveImagesClass {
	fullsize: Fullsize;
}

export interface Fullsize {
	urls: string[];
	base64svg: string;
}

export interface OfflineBannerImage {
	src: string;
	srcset: string;
}

export interface Plan {
	id: number;
	channel_id: number;
	stripe_plan_id: string;
	amount: string;
	created_at: Date;
	updated_at: Date;
}

export interface PreviousLivestream {
	id: number;
	slug: string;
	channel_id: number;
	created_at: Date;
	session_title: string;
	is_live: boolean;
	risk_level_id: null;
	start_time: Date;
	source: string;
	twitch_channel: null;
	duration: number;
	language: string;
	is_mature: boolean;
	viewer_count: number;
	thumbnail: OfflineBannerImage;
	views: number;
	lang_iso: string;
	tags: any[];
	categories: Category[];
	video: Video;
}

export interface Video {
	id: number;
	live_stream_id: number;
	slug: null;
	thumb: null;
	s3: null;
	trading_platform_id: null;
	created_at: Date;
	updated_at: Date;
	uuid: string;
	views: number;
	deleted_at: null;
	is_pruned: boolean;
	is_private: boolean;
	status: ChatMode;
}

export interface SubscriberBadge {
	id: number;
	channel_id: number;
	months: number;
	badge_image: OfflineBannerImage;
}

export interface UserData {
	id: number;
	username: string;
	agreed_to_terms: boolean;
	email_verified_at: Date;
	bio: null | string;
	country: null | string;
	state: null | string;
	city: null | string;
	instagram: null | string;
	twitter: null | string;
	youtube: null | string;
	discord: null | string;
	tiktok: null | string;
	facebook: null | string;
	profilePic: null | string;
	profile_pic: null | string;
}

export interface Verified {
	id: number;
	channel_id: number;
	created_at: Date;
	updated_at: Date;
}

export interface KickEmotes {
	id: number;
	user_id: number;
	slug: string;
	is_banned: boolean;
	playback_url: string;
	name_updated_at: Date | null;
	vod_enabled: boolean;
	subscription_enabled: boolean;
	is_affiliate: boolean;
	emotes: KickEmote[];
	can_host: boolean;
	user: UserData;
}

export interface KickGlobals {
	name: 'Emojis' | 'Global';
	id: 'Emoji' | 'Global';
	emotes: KickEmote[];
}

export interface KickEmote {
	id: number;
	channel_id: number | null;
	name: string;
	subscribers_only: boolean;
}
