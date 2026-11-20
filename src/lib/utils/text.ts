export function compareName(login: string | null, displayName: string | null): string {
	if (!login || !displayName) {
		return '';
	}

	return login.toLowerCase() === displayName.toLowerCase() ? displayName : login;
}

export function getChannelPath(channel: {
	id?: string;
	username: string | null;
	platform: string;
}): string {
	const slug =
		channel.platform === 'youtube' && channel.id
			? channel.id
			: channel.username?.toLocaleLowerCase();

	return `/channel/${channel.platform}/${slug}`;
}

export function getCheerName(input: string): string {
	const match = input.match(/^(.*)\s\d+$/);
	return match ? match[1] : input;
}

export function normalizeText(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();
}

export function includesFromArray(str: string, arr: string[]): boolean {
	return arr.some((item) => str.includes(item));
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function decodeHtml(text: string): string {
	return text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&amp;/g, '&');
}

function levenshteinDistance(str1: string, str2: string): number {
	const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
		Array<number>(str1.length + 1).fill(0)
	);

	for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
	for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1,
				matrix[j - 1][i] + 1,
				matrix[j - 1][i - 1] + substitutionCost
			);
		}
	}

	return matrix[str2.length][str1.length];
}

export function calculateSimilarity(searchTerm: string, username: string): number {
	const search = searchTerm.toLowerCase();
	const user = username.toLowerCase();

	if (user.includes(search)) {
		const startBonus = user.startsWith(search) ? 0.3 : 0;
		const lengthRatio = search.length / user.length;
		return 0.7 + startBonus + lengthRatio * 0.3;
	}

	const maxLength = Math.max(search.length, user.length);
	const distance = levenshteinDistance(search, user);
	return Math.max(0, (maxLength - distance) / maxLength);
}
