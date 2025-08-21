import { getLocaleFromNavigator, init, register } from 'svelte-i18n';
import { browser } from '$app/environment';

const defaultLocale = 'en';

const context = import.meta.glob('$lib/i18n/locales/*.json');
Object.keys(context).forEach((key) => {
	const match = key.match(/\/([^\/]+)\.json/);
	if (match) {
		const locale = match[1];
		register(locale, () => {
			return import(`$lib/i18n/locales/${locale}.json`);
		});
	}
});

function getInitialLocale() {
	if (!browser) {
		return defaultLocale;
	}
	const savedLocale = window.localStorage.getItem('locale');
	const value = savedLocale ?? getLocaleFromNavigator();

	if (value) {
		window.localStorage.setItem('locale', value);
	}

	return value;
}

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale()
});
