import { locale, waitLocale } from 'svelte-i18n';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import '$lib/i18n';

export const load: LayoutLoad = async () => {
	if (browser) {
		const savedLocale = localStorage.getItem('locale');

		if (!savedLocale) {
			locale.set(window.navigator.language);
		} else {
			locale.set(savedLocale);
		}
	}

	await waitLocale();
};
