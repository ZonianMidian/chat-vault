import { addMessages, init } from 'svelte-i18n';
import { chooseSupported } from '#lib/utils/locale.ts';

type Dictionary = Parameters<typeof addMessages>[1];

const loaders = import.meta.glob<Dictionary>('./locales/*.json', { import: 'default' });

export const defaultLocale = 'en';

export const supportedLocales = Object.keys(loaders)
	.map((path) => path.match(/\/([^/]+)\.json$/)?.[1])
	.filter((code): code is string => !!code);

const loading = new Map<string, Promise<void>>();

function loadDictionary(code: string): Promise<void> {
	let task = loading.get(code);

	if (!task) {
		const loader = loaders[`./locales/${code}.json`];
		task = loader
			? loader().then((messages) => addMessages(code, messages))
			: Promise.resolve();

		task.catch(() => loading.delete(code));
		loading.set(code, task);
	}

	return task;
}

export async function loadLocale(code: string): Promise<void> {
	await Promise.all([loadDictionary(code), loadDictionary(defaultLocale)]);
}

export function resolveLocale(...candidates: (string | null | undefined)[]): string {
	for (const candidate of candidates) {
		const match = chooseSupported(candidate, supportedLocales);
		if (match) return match;
	}

	return defaultLocale;
}

init({
	fallbackLocale: defaultLocale,
	initialLocale: defaultLocale
});
