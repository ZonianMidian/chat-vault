<script lang="ts">
	import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
	import { migrateLegacyStorage } from '#lib/tools/preferences.ts';
	import { toJsonLd, websiteSchema } from '#lib/seo.ts';
	import { _, locale } from 'svelte-i18n';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	import '@fontsource-variable/inter';
	import '../app.css';

	import Navbar from '#lib/components/NavBar.svelte';

	let { data, children } = $props();

	// svelte-ignore state_referenced_locally
	locale.set(data.locale);

	$effect.pre(() => {
		locale.set(data.locale);
	});

	const website = $derived(toJsonLd(websiteSchema(page.url.origin, $_('landing.hero.subtitle'))));

	onMount(() => {
		polyfillCountryFlagEmojis();
		migrateLegacyStorage(data.locale);
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Chat Vault" />
	<meta property="og:locale" content={data.locale.replace('-', '_')} />
	<meta name="theme-color" content="#74c7ec" />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html website}
</svelte:head>

<Navbar />
<main>
	{@render children()}
</main>
