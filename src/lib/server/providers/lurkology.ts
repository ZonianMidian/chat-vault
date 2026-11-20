import type { SearchEmote, SearchProvider } from '#lib/emotes/search.ts';

import { searchProviders } from '#lib/emotes/search.ts';
import { ProviderError, requestJson } from '#lib/server/http.ts';

interface LurkologyEmote {
	provider: string;
	id: string;
	name: string;
	url: string;
	uses: number;
}

interface LurkologyTop {
	byProvider?: Partial<Record<string, LurkologyEmote[]>>;
	trending?: LurkologyEmote[];
}

export interface TopEmotes {
	trending: SearchEmote[];
	byProvider: Record<SearchProvider, SearchEmote[]>;
}

const images: Record<SearchProvider, (id: string) => string> = {
	'7tv': (id) => `https://cdn.7tv.app/emote/${id}/4x.avif`,
	bttv: (id) => `https://cdn.betterttv.net/emote/${id}/3x.webp`,
	ffz: (id) => `https://cdn.frankerfacez.com/emote/${id}/4`,
	twitch: (id) => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`
};

const isProvider = (name: string): name is SearchProvider =>
	searchProviders.includes(name as SearchProvider);

function transform(list: LurkologyEmote[] | undefined): SearchEmote[] {
	return (list ?? [])
		.filter((emote) => isProvider(emote.provider) && emote.id && emote.name)
		.map((emote) => ({
			id: emote.id,
			name: emote.name,
			image: images[emote.provider as SearchProvider](emote.id),
			owner: null,
			provider: emote.provider
		}));
}

export async function getTopEmotes(): Promise<TopEmotes> {
	const source = '[Lurkology] Top Emotes';
	const data = await requestJson<LurkologyTop>(
		source,
		'https://api.lurkology.com/v1/emotes/top?period=7d'
	);

	if (!data?.byProvider && !data?.trending) {
		throw new ProviderError(source, 502);
	}

	return {
		trending: transform(data.trending),
		byProvider: Object.fromEntries(
			searchProviders.map((provider) => [provider, transform(data.byProvider?.[provider])])
		) as Record<SearchProvider, SearchEmote[]>
	};
}
