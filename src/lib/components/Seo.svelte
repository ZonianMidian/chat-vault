<script lang="ts">
	import { breadcrumbSchema, toJsonLd, type Breadcrumb, type Schema } from '#lib/seo.ts';
	import { page } from '$app/state';

	let {
		title = null,
		description = null,
		image = null,
		path = null,
		type = 'website',
		noindex = false,
		breadcrumbs = null,
		schema = null
	}: {
		title?: string | null;
		description?: string | null;
		image?: string | null;
		path?: string | null;
		type?: 'website' | 'profile';
		noindex?: boolean;
		breadcrumbs?: Breadcrumb[] | null;
		schema?: Schema | null;
	} = $props();

	const origin = $derived(page.url.origin);
	const fullTitle = $derived(title ? `${title} | Chat Vault` : 'Chat Vault');
	const summary = $derived(
		description && description.length > 200 ? `${description.slice(0, 197)}...` : description
	);
	const imageUrl = $derived(
		!image ? `${origin}/favicon.png` : image.startsWith('/') ? `${origin}${image}` : image
	);

	const structuredData = $derived(
		[schema, breadcrumbs?.length ? breadcrumbSchema(origin, breadcrumbs) : null]
			.filter((item) => item !== null)
			.map(toJsonLd)
			.join('')
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta property="og:title" content={title ?? 'Chat Vault'} />
	<meta property="og:type" content={type} />
	<meta name="twitter:title" content={title ?? 'Chat Vault'} />

	{#if summary}
		<meta name="description" content={summary} />
		<meta property="og:description" content={summary} />
		<meta name="twitter:description" content={summary} />
	{/if}

	{#if path !== null}
		<meta property="og:url" content="{origin}{path}" />
		<link rel="canonical" href="{origin}{path}" />
	{/if}

	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content={title ?? 'Chat Vault'} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:image" content={imageUrl} />

	<meta
		name="robots"
		content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}
	/>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredData}
</svelte:head>
