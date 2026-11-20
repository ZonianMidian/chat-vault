import { base58ToObjectId, isBase58Id, isObjectId, objectIdToUlid } from '#lib/utils/ids.ts';

export type Provider = 'twitch' | 'youtube' | 'kick' | 'bttv' | 'ffz' | '7tv';

const aliases: Record<string, Provider> = {
	twitch: 'twitch',
	ttv: 'twitch',
	tw: 'twitch',

	youtube: 'youtube',
	yt: 'youtube',

	kick: 'kick',

	bettertwitchtv: 'bttv',
	betterttv: 'bttv',
	bttv: 'bttv',

	frankerfacez: 'ffz',
	ffz: 'ffz',

	seventv: '7tv',
	stv: '7tv',
	'7tv': '7tv'
};

export function resolveProvider(name: string): Provider | null {
	return aliases[name.toLowerCase()] ?? null;
}

export function canonicalId(provider: Provider, id: string): string {
	if (provider === '7tv' && isObjectId(id)) return objectIdToUlid(id);
	if (provider === 'bttv' && isBase58Id(id)) return base58ToObjectId(id);

	return id;
}
