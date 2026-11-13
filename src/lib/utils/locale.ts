const localeMapping: Record<string, Record<string, string>> = {
	zh: {
		'zh-Hant': 'zh-TW',
		'zh-TW': 'zh-TW',
		'zh-HK': 'zh-TW',
		'zh-MO': 'zh-TW',
		'zh-Hans': 'zh-CN',
		'zh-CN': 'zh-CN',
		'zh-SG': 'zh-CN',
		zh: 'zh-CN'
	},
	pt: {
		pt: 'pt-BR',
		'pt-BR': 'pt-BR',
		'pt-PT': 'pt-PT'
	}
};

export function normalizeLocale(locale: string): string {
	return locale.trim().replace(/_/g, '-');
}

function mapLocale(input: string, supported: string[]): string | null {
	const [lang] = input.split('-');

	const langMapping = localeMapping[lang];
	if (!langMapping) return null;

	const mapped = langMapping[input] || langMapping[lang];
	return mapped && supported.includes(mapped) ? mapped : null;
}

export function chooseSupported(
	value: string | null | undefined,
	supported: string[]
): string | null {
	if (!value) return null;

	const normalized = normalizeLocale(value);
	const exact = supported.find((code) => code.toLowerCase() === normalized.toLowerCase());
	if (exact) return exact;

	const mapped = mapLocale(normalized, supported);
	if (mapped) return mapped;

	const baseLang = normalized.split('-')[0].toLowerCase();
	return supported.includes(baseLang) ? baseLang : null;
}

export function parseAcceptLanguage(header: string | null | undefined): string[] {
	if (!header) return [];

	return header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const quality = params.find((param) => param.trim().startsWith('q='));
			return { tag: tag.trim(), q: quality ? Number(quality.split('=')[1]) : 1 };
		})
		.filter(({ tag, q }) => tag && tag !== '*' && !isNaN(q) && q > 0)
		.sort((a, b) => b.q - a.q)
		.map(({ tag }) => tag);
}
