import { getLocaleFromNavigator, init, register } from 'svelte-i18n';
import { chooseSupported } from '$lib/utils';
import { browser } from '$app/environment';

const context = import.meta.glob('$lib/i18n/locales/*.json');
const defaultLocale = 'en';

export const supported = Object.keys(context)
	.map((path) => path.match(/\/([^\/]+)\.json$/)?.[1])
	.filter(Boolean) as string[];

supported.forEach((locale) => {
	register(locale, () => import(`$lib/i18n/locales/${locale}.json`));
});

function getInitialLocale(): string {
	if (!browser) return defaultLocale;

	const saved = localStorage.getItem('locale');
	if (saved) return saved;

	const navigatorLocale = getLocaleFromNavigator() ?? defaultLocale;
	return chooseSupported(navigatorLocale, supported) ?? defaultLocale;
}

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale()
});
