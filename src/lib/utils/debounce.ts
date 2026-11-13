export interface Debounced<A extends unknown[]> {
	(...args: A): void;
	cancel: () => void;
	flush: () => void;
}

export function debounce<A extends unknown[]>(
	func: (...args: A) => void,
	wait: number
): Debounced<A> {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastArgs: A | null = null;

	const debounced = (...args: A): void => {
		lastArgs = args;
		if (timeoutId !== null) clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			timeoutId = null;
			func(...args);
		}, wait);
	};

	debounced.cancel = (): void => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	debounced.flush = (): void => {
		if (timeoutId !== null && lastArgs) {
			clearTimeout(timeoutId);
			timeoutId = null;
			func(...lastArgs);
		}
	};

	return debounced;
}
