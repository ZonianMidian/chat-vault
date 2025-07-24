import type { Theme } from '$lib/types/common';

import { readable } from 'svelte/store';

const themeEvent = 'storedThemeChange';

const dispatchThemeChange = () => {
	window.dispatchEvent(new CustomEvent(themeEvent));
};

export const setTheme = (theme: Theme) => {
	if (theme === null || theme === 'system') {
		localStorage.removeItem('theme');
	} else {
		localStorage.setItem('theme', theme);
	}
	dispatchThemeChange();
};

export const isDarkMode = readable(false, (set) => {
	if (typeof window === 'undefined') return;

	const getThemeFromStorage = (): boolean | null => {
		const theme = localStorage.getItem('theme');
		if (theme === 'dark') return true;
		if (theme === 'light') return false;
		return null;
	};

	const getSystemPreference = (): boolean => {
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	};

	const applyTheme = () => {
		const storedTheme = getThemeFromStorage();
		if (storedTheme !== null) {
			set(storedTheme);
		} else {
			set(getSystemPreference());
		}
	};

	applyTheme();

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const mediaListener = (event: MediaQueryListEvent) => {
		const storedTheme = getThemeFromStorage();
		if (storedTheme === null) {
			set(event.matches);
		}
	};

	const storageListener = (event: StorageEvent) => {
		if (event.key === 'theme') {
			applyTheme();
		}
	};

	const customThemeListener = () => {
		applyTheme();
	};

	mediaQuery.addEventListener('change', mediaListener);

	window.addEventListener('storage', storageListener);
	window.addEventListener(themeEvent, customThemeListener);

	return () => {
		mediaQuery.removeEventListener('change', mediaListener);

		window.removeEventListener('storage', storageListener);
		window.removeEventListener(themeEvent, customThemeListener);
	};
});
