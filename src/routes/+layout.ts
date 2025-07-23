import { locale, waitLocale } from 'svelte-i18n';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import '$lib/i18n';

export const load: LayoutLoad = async () => {
	if (browser) {
		locale.set(window.navigator.language);
	}
	await waitLocale();
};
