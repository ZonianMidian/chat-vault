import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const rules = ['User-agent: *', 'Allow: /', 'Disallow: /api/', ''];

	return new Response(rules.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
