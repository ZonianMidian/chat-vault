import type { Sizes } from '#lib/types/common.ts';

import { formatFileSize } from './format';
import { includesFromArray } from './text';

export const imageProxy = 'https://wsrv.nl/?n=-1&url=';

const blockingHosts = /^https?:\/\/yt3\.(?:ggpht|googleusercontent)\.com\//i;

type ImageKind = 'emote' | 'badge';

const imageDimensions: Record<ImageKind, Record<string, number[]>> = {
	emote: {
		'7tv': [32, 64, 96, 128],
		twitch: [28, 56, 112],
		youtube: [24, 48, 96],
		bttv: [28, 56, 112],
		kick: [35, 70, 140],
		ffz: [32, 64, 128]
	},
	badge: {
		'7tv': [18, 36, 54, 72],
		twitch: [18, 36, 72],
		kick: [18, 36, 72],
		ffz: [18, 36, 72]
	}
};

const defaultDimensions: Record<ImageKind, number[]> = {
	emote: [32, 64, 128],
	badge: [18, 36, 72]
};

export function getImageSizes(
	kind: ImageKind,
	provider: string
): { width: number; height: number }[] {
	return (imageDimensions[kind][provider] ?? defaultDimensions[kind]).map((size) => ({
		width: size,
		height: size
	}));
}

export const proxyImage = (url: string): string => imageProxy + encodeURIComponent(url);

export function displayImage(url: string): string {
	return blockingHosts.test(url) ? proxyImage(url) : url;
}

export function resizeImageUrl(url: string, size: number): string {
	return `https://wsrv.nl/?url=${url}&w=${size}&h=${size}&n=-1`;
}

export function getFavicon(url: string): { url: string; icon: string } {
	let fixed = url.trim();
	if (!/^https?:\/\//i.test(fixed)) {
		fixed = `https://${fixed}`;
	}

	const parsed = new URL(fixed);
	const path = parsed.pathname.replace(/\/+$/, '');
	const host = parsed.hostname.replace(/^www\./i, '');

	return {
		url: `${parsed.protocol}//${host}${path}`,
		icon: `https://favicon.yandex.net/favicon/${host}?size=32`
	};
}

export async function getImageInfo(url: string, proxy: boolean): Promise<Sizes> {
	if (includesFromArray(url, ['imgur', 'ivr', 'amazonaws'])) {
		proxy = true;
	} else if (includesFromArray(url, ['wsrv.nl']) || url.startsWith('/')) {
		proxy = false;
	}

	try {
		const response = await fetch(proxy ? proxyImage(url) : url);
		if (!response.ok) {
			throw new Error(`Image request failed: ${response.status}`);
		}

		const blob = await response.blob();
		const size = formatFileSize(blob.size);
		const objectUrl = URL.createObjectURL(blob);

		return await new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve({ width: img.width, height: img.height, size, objectUrl });
			img.onerror = () => resolve({ width: null, height: null, size, objectUrl });
			img.src = objectUrl;
		});
	} catch {
		return { width: null, height: null, size: null, objectUrl: url };
	}
}
