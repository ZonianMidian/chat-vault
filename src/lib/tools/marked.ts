import { browser } from '$app/environment';
import { marked } from 'marked';

function isExternalLink(href: string): boolean {
	if (!browser) return false;
	if (!/^https?:\/\//i.test(href)) return false;

	try {
		return new URL(href).origin !== window.location.origin;
	} catch {
		return false;
	}
}

export function renderMarkdown(md: string): string {
	const html = marked.parse(md) as string;

	const container = document.createElement('div');
	container.innerHTML = html;

	const links = container.getElementsByTagName('a');
	for (const a of Array.from(links)) {
		const href = a.getAttribute('href') ?? '';
		if (isExternalLink(href)) {
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener noreferrer');
		}
	}

	return container.innerHTML;
}
