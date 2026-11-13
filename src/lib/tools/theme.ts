import type { Theme } from '#lib/types/common.ts';

import { deleteCookie, readCookie, writeCookie } from './cookies';
import { readable } from 'svelte/store';

const themeEvent = 'storedThemeChange';

export function parseTheme(value: string | null | undefined): 'dark' | 'light' | null {
	return value === 'dark' || value === 'light' ? value : null;
}

export function getStoredTheme(): 'dark' | 'light' | null {
	return parseTheme(readCookie('theme'));
}

export const setTheme = (theme: Theme) => {
	const stored = parseTheme(theme);

	if (stored) {
		writeCookie('theme', stored);
	} else {
		deleteCookie('theme');
	}

	window.dispatchEvent(new CustomEvent(themeEvent));
};

export const isDarkMode = readable(false, (set) => {
	if (typeof window === 'undefined') return;

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const applyTheme = () => {
		const stored = getStoredTheme();
		set(stored ? stored === 'dark' : mediaQuery.matches);
	};

	applyTheme();

	mediaQuery.addEventListener('change', applyTheme);
	window.addEventListener(themeEvent, applyTheme);

	return () => {
		mediaQuery.removeEventListener('change', applyTheme);
		window.removeEventListener(themeEvent, applyTheme);
	};
});
