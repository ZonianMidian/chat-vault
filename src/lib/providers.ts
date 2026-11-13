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
