<script lang="ts">
	import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
	import { navigating } from '$app/state';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import '@fontsource-variable/inter';
	import '../app.css';

	import Navbar from '$lib/components/NavBar.svelte';

	let { children } = $props();

	let jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Chat Vault',
		url: `${page.url.origin}/`,
		description: `${$_('landing.hero.subtitle')}`
	};

	polyfillCountryFlagEmojis();
</script>

<svelte:head>
	<meta property="og:site_name" content="Chat Vault" />
	<meta property="og:type" content="website" />

	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<Navbar />
<main>
	{#if navigating.to}
		<div class="container-general container-h">
			<span class="loading loading-dots loading-xl"></span>
		</div>
	{:else}
		{@render children()}
	{/if}
</main>
