import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const rules = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /api/',
		'',
		`Sitemap: ${url.origin}/sitemap.xml`,
		''
	];

	return new Response(rules.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
