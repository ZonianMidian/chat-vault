export const definedStatus = [400, 404, 500, 503];

type Translate = (key: string) => string;

function isAppError(error: unknown): error is App.Error {
	return typeof error === 'object' && error !== null && 'message' in error;
}

export function describeError(error: unknown, translate: Translate, status?: number): string {
	if (!isAppError(error)) return translate('error.unknown');

	const code = error.status ?? status ?? 500;
	const text = error.key
		? translate(error.key)
		: definedStatus.includes(code)
			? translate(`status.${code}`)
			: translate('error.unknown');

	return error.source ? `${error.source} | ${code}: ${text}` : text;
}
