export interface BTTVEmote {
	message?: string;
	id: string;
	code: string;
	imageType: ImageType;
	animated: boolean;
	createdAt: Date;
	updatedAt: Date;
	global: boolean;
	live: boolean;
	sharing: boolean;
	approvalStatus: 'APPROVED' | 'AUTO_APPROVED';
	user: BTTVChannel;
	modifier?: boolean;
}

type ImageType = 'png' | 'gif';

export interface BTTVGlobals {
	id: string;
	code: string;
	imageType: ImageType;
	animated: boolean;
	userId?: string;
	user?: BTTVChannel;
	modifier: boolean;
	width?: number;
	height?: number;
}

export interface BTTVUser {
	id: string;
	name?: string;
	displayName?: string;
	providerId?: string;
	bots: string[];
	avatar?: string;
	channelEmotes: BTTVGlobals[];
	sharedEmotes: BTTVGlobals[];
}

export interface BTTVChannels {
	message?: string;
	id: string;
	user: BTTVChannel;
}

export interface BTTVChannel {
	id: string;
	name: string;
	displayName: string;
	providerId: string;
	avatar: string;
}
