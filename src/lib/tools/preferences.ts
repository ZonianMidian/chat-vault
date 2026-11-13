import { loadLocale, supportedLocales } from '#lib/i18n/index.ts';
import { getStoredTheme, parseTheme, setTheme } from './theme';
import { readCookie, writeCookie } from './cookies';
import { refreshAll } from '$app/navigation';
import { locale } from 'svelte-i18n';

export async function setLocale(code: string): Promise<void> {
	writeCookie('locale', code);

	await loadLocale(code);
	await locale.set(code);

	await refreshAll();
}

const legacyKeys = [
	'locale',
	'theme',
	'globalEmotes',
	'globalEmotesExp',
	'globalBadges',
	'globalBadgesExp',
	'originData',
	'originDataExp'
];

export function migrateLegacyStorage(currentLocale: string): void {
	try {
		const legacyLocale = localStorage.getItem('locale');
		const legacyTheme = parseTheme(localStorage.getItem('theme'));

		legacyKeys.forEach((key) => localStorage.removeItem(key));

		if (legacyTheme && !getStoredTheme()) {
			setTheme(legacyTheme);
		}

		if (
			legacyLocale &&
			legacyLocale !== currentLocale &&
			supportedLocales.includes(legacyLocale) &&
			!readCookie('locale')
		) {
			void setLocale(legacyLocale);
		}
	} catch {
		// ignore
	}
}
