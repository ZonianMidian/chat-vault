const ONE_YEAR = 60 * 60 * 24 * 365;

export function readCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;

	const match = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function writeCookie(name: string, value: string): void {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function deleteCookie(name: string): void {
	document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}
