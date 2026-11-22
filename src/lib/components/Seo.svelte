<script lang="ts">
	import {
		absolute,
		breadcrumbSchema,
		entitySchema,
		shareableImage,
		toJsonLd,
		webPageSchema,
		websiteSchema,
		type Breadcrumb,
		type PageImage,
		type PageType,
		type Schema
	} from '#lib/seo.ts';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	const logo: PageImage = {
		url: '/web-app-manifest-512x512.png',
		width: 512,
		height: 512,
		caption: 'Chat Vault'
	};

	let {
		title = null,
		description = null,
		image = null,
		primaryImage = null,
		path = undefined,
		type = 'website',
		pageType = 'WebPage',
		noindex = false,
		breadcrumbs = null,
		schema = null,
		source = null,
		datePublished = null,
		dateModified = null
	}: {
		title?: string | null;
		description?: string | null;
		image?: string | null;
		primaryImage?: PageImage | null;
		path?: string | null;
		type?: 'website' | 'profile' | 'article';
		pageType?: PageType;
		noindex?: boolean;
		breadcrumbs?: Breadcrumb[] | null;
		schema?: Schema | Schema[] | null;
		source?: string | null;
		datePublished?: Date | string | null;
		dateModified?: Date | string | null;
	} = $props();

	const origin = $derived(page.url.origin);
	const locale = $derived((page.data.locale as string | undefined) ?? 'en');
	const siteDescription = $derived($_('landing.hero.subtitle'));

	const name = $derived(title ?? 'Chat Vault');
	const fullTitle = $derived(title ? `${title} | Chat Vault` : 'Chat Vault');
	const summary = $derived.by(() => {
		const text = (description ?? siteDescription).replace(/\s+/g, ' ').trim();
		return text.length > 200 ? `${text.slice(0, 197)}...` : text;
	});

	const canonicalPath = $derived(path === undefined ? page.url.pathname : path);
	const url = $derived(`${origin}${canonicalPath ?? page.url.pathname}`);

	const preview = $derived.by((): PageImage => {
		if (image) return { url: absolute(origin, shareableImage(image)) };
		if (primaryImage) return { ...primaryImage, url: absolute(origin, primaryImage.url) };
		return { ...logo, url: absolute(origin, logo.url) };
	});

	const mainImage = $derived.by((): PageImage => {
		const chosen = primaryImage ?? (image ? { url: shareableImage(image) } : logo);
		return { ...chosen, url: absolute(origin, chosen.url), caption: chosen.caption ?? name };
	});

	const robots = $derived(
		noindex
			? 'noindex, follow'
			: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
	);

	const crumbs = $derived(
		breadcrumbs ?? (canonicalPath === '/' ? [] : [{ name: title ?? 'Chat Vault' }])
	);

	const entities = $derived(schema ? (Array.isArray(schema) ? schema : [schema]) : []);

	const structuredData = $derived(
		[
			websiteSchema(origin, siteDescription, locale, [
				{ name: $_('emote.search'), path: '/emote/search' },
				{ name: $_('channel.search'), path: '/channel/search' }
			]),
			webPageSchema({
				origin,
				url,
				locale,
				type: pageType,
				name,
				title: fullTitle,
				description: summary,
				image: mainImage,
				source,
				datePublished,
				dateModified,
				mainEntity: entities[0]
			}),
			breadcrumbSchema(origin, url, crumbs),
			...entities.slice(1).map((entity) => entitySchema(entity, url))
		]
			.map(toJsonLd)
			.join('')
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={summary} />
	<meta name="robots" content={robots} />

	{#if !noindex && canonicalPath !== null}
		<link rel="canonical" href={url} />
	{/if}

	<meta property="og:title" content={name} />
	<meta property="og:description" content={summary} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={preview.url} />
	{#if preview.url.startsWith('https://')}
		<meta property="og:image:secure_url" content={preview.url} />
	{/if}
	{#if preview.width && preview.height}
		<meta property="og:image:width" content={String(preview.width)} />
		<meta property="og:image:height" content={String(preview.height)} />
	{/if}
	<meta property="og:image:alt" content={preview.caption ?? name} />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={name} />
	<meta name="twitter:description" content={summary} />
	<meta name="twitter:image" content={preview.url} />
	<meta name="twitter:image:alt" content={preview.caption ?? name} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredData}
</svelte:head>
