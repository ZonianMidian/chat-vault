import { getBTTVChannels } from '$lib/providers/bttv';
import { getFFZChannels } from '$lib/providers/ffz';
import { get7TVChannels } from '$lib/providers/7tv';
import { $format } from '$lib/utils';

export async function fetchChannels(
	provider: string,
	emoteId: string,
	page: number,
	before: string | null
) {
	try {
		switch (provider.toLowerCase()) {
			case 'betterttv':
			case 'bttv': {
				return await getBTTVChannels(emoteId, before);
			}
			case 'frankerfacez':
			case 'ffz': {
				return await getFFZChannels(emoteId, page);
			}
			case 'seventv':
			case '7tv': {
				return await get7TVChannels(emoteId, page);
			}
			default:
				throw new Error($format('error.provider'));
		}
	} catch (err) {
		console.error(`[${$format('emote.label')}] ${$format('navbar.channels')}:`, err);
		throw new Error(
			`[${$format('emote.label')}] ${$format('navbar.channels')}: ${err instanceof Error ? err.message : $format('error.unknown')}`
		);
	}
}
