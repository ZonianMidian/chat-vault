import type { Emote, Variant } from '#lib/types/common.ts';

import { cached, profiles } from '#lib/server/cache.ts';
import { exists } from '#lib/server/http.ts';
import { log } from '#lib/server/logger.ts';
import { getBaseEmoteId } from './fetchExtras';

// prettier-ignore
const emoteVariants = [
	'BE', 'BN', 'BT', 'BW', 'CL', 'EB', 'EG', 'EV', 'FB', 'FC', 'FF',
	'GR', 'HB', 'HE', 'HF', 'KI', 'LH', 'MC', 'PK', 'PM', 'RA', 'RB',
	'RD', 'SA', 'SF', 'SG', 'SM', 'SO', 'SQ', 'TK', 'UN', 'WD', 'WH'
];

const variantImage = (emoteId: string): string =>
	`https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;

function findAvailableVariants(baseId: string): Promise<string[]> {
	return cached(`emote-variants:twitch:${baseId}`, profiles.static, async () => {
		const checks = await Promise.all(
			emoteVariants.map(async (variant) =>
				(await exists(variantImage(`${baseId}_${variant}`))) ? variant : null
			)
		);

		return checks.filter((variant): variant is string => variant !== null);
	});
}

export async function fetchVariants(emote: Emote): Promise<Variant[]> {
	if (emote.provider !== 'twitch') return [];

	try {
		const baseId = getBaseEmoteId(emote);
		const current = emote.id === baseId ? null : emote.id.slice(-2);
		const baseName = emote.name.replace(/_[A-Z]{2}$/, '');

		const variants: Variant[] = (await findAvailableVariants(baseId))
			.filter((variant) => variant !== current)
			.map((variant) => ({
				id: `${baseId}_${variant}`,
				name: `${baseName}_${variant}`,
				image: variantImage(`${baseId}_${variant}`),
				provider: 'twitch',
				variant
			}));

		if (current) {
			variants.unshift({
				id: baseId,
				name: baseName,
				image: emote.altImage || variantImage(baseId),
				provider: 'twitch',
				variant: ''
			});
		}

		return variants;
	} catch (err) {
		log.error('Emote', `Could not get the variants of ${emote.id}`, err);
		return [];
	}
}
