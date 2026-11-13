import { escapeHtml } from '#lib/utils/text.ts';
import { Marked } from 'marked';

const isExternalLink = (href: string): boolean => /^https?:\/\//i.test(href);
const isSafeLink = (href: string): boolean => isExternalLink(href) || href.startsWith('/');

const marked = new Marked({
	renderer: {
		html({ text }) {
			return escapeHtml(text);
		},
		link({ href, title, tokens }) {
			const text = this.parser.parseInline(tokens);
			if (!isSafeLink(href)) return text;

			const attributes = [
				`href="${escapeHtml(href)}"`,
				title ? `title="${escapeHtml(title)}"` : '',
				isExternalLink(href) ? 'target="_blank" rel="noopener noreferrer"' : ''
			];

			return `<a ${attributes.filter(Boolean).join(' ')}>${text}</a>`;
		}
	}
});

export function renderMarkdown(md: string): string {
	return marked.parse(md, { async: false });
}
