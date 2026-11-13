import { format, number, unwrapFunctionStore } from 'svelte-i18n';
import { defaultLocale, loadLocale, supportedLocales } from '#lib/i18n/index.ts';
import { getSubscriptionTier } from '#lib/utils/index.ts';

const $format = unwrapFunctionStore(format);
const $number = unwrapFunctionStore(number);

type Values = Record<string, string | number>;

export interface Translator {
	readonly locale: string;
	t(key: string, values?: Values, fallback?: string): string;
	number(value: number): string;
	duration(months: number, isBadge?: boolean): string;
}

export function createTranslator(locale: string): Translator {
	const t: Translator['t'] = (key, values, fallback) =>
		$format(key, { locale, values, default: fallback ?? key });

	return {
		locale,
		t,
		number: (value) => $number(value, { locale }),
		duration(months, isBadge = false) {
			const key = isBadge ? 'badge' : 'channel';

			const tier = getSubscriptionTier(months);
			months = tier > 1 ? months - tier * 1000 : months;

			if (months < 12) {
				return t(`${key}.month`, { count: months });
			}

			const years = months / 12;
			const count = Number.isInteger(years) ? years.toString() : years.toFixed(1);

			return t(`${key}.year`, { count });
		}
	};
}

let ready: Promise<unknown> | null = null;

export function loadAllLocales(): Promise<unknown> {
	ready ??= Promise.all(supportedLocales.map(loadLocale));
	return ready;
}

export function getLocaleNames(): { code: string; language: string }[] {
	return supportedLocales
		.map((code) => ({ code, language: $format('language', { locale: code, default: code }) }))
		.sort((a, b) => a.language.localeCompare(b.language, defaultLocale));
}
