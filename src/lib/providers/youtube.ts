import type { Emote, Emotes } from '$lib/types/common';

import { $format, findGlobalEmote, proxyUrl } from '$lib/utils';

export async function getYouTubeEmote(emoteId: string): Promise<Emote> {
	const isGlobal = await findGlobalEmote(emoteId, 'youtube');

	if (!isGlobal) {
		const url = `${proxyUrl}https://yt3.ggpht.com/${emoteId}=s48-c`;

		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`[YouTube] Emote | 404: ${$format('status.404')}`);
		}
	}

	return {
		id: emoteId.toString(),
		name: isGlobal ? isGlobal.name : '',
		provider: 'youtube',
		tags: [],
		artist: null,
		owner: isGlobal
			? {
					id: 'UCBR8-60-B28hp2BmDPdntcQ',
					avatar: 'https://yt3.ggpht.com/Bg5wS82KGryRmcsn1YbPThtbXoTmj2XJ9_7LmuE2RF6wbKJBkovfRypbSz6UD3gEu_nHiwGZtQ=s300',
					source: 'https://youtube.com/@YouTube',
					username: 'YouTube',
					platform: 'youtube'
				}
			: null,
		images: [
			`https://yt3.ggpht.com/${emoteId}=s24-c`,
			`https://yt3.ggpht.com/${emoteId}=s48-c`,
			`https://yt3.ggpht.com/${emoteId}=s96-c`
		],
		source: isGlobal ? 'https://youtube.com/@YouTube' : `https://youtube.com`,
		createdAt: null,
		approved: true,
		type: isGlobal ? 'GLOBALS' : 'CHANNEL',
		public: true,
		animated: false,
		global: !!isGlobal,
		deleted: false,
		channels: {
			total: 0,
			list: []
		}
	};
}

export async function getYouTubeGlobalEmotes(): Promise<Emotes[]> {
	const url = `${proxyUrl}https://gist.githubusercontent.com/ZonianMidian/fc833761e7d31a3e64cd0ff288d61067/raw/ad5b3332ecb837ae77205f8d9062d918d52a9ece/youtube_emojis.json`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`[YouTube] Global Emotes | 404: ${$format('status.404')}`);
	}

	const data = await res.json();
	if (!data || !Array.isArray(data)) {
		throw new Error(`[YouTube] Global Emotes | 500: ${$format('status.500')}`);
	}

	return data.map((emoji) => {
		return {
			id: emoji.id.toString(),
			name: emoji.name,
			image: emoji.image,
			owner: null,
			provider: 'youtube'
		};
	});
}
