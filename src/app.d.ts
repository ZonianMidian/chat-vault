import type { LocaleInfo } from '#lib/types/common.ts';

declare global {
	const __VERSION__: string;
	const __COMMIT__: string | null;

	namespace App {
		interface Error {
			message: string;
			status?: number;
			source?: string;
			key?: string;
		}

		interface Locals {
			locale: string;
			theme: 'dark' | 'light' | null;
		}

		interface PageData {
			locale: string;
			theme: 'dark' | 'light' | null;
			locales: LocaleInfo[];
		}
	}
}

export {};
