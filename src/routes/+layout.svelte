<script lang="ts">
	import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
	import { migrateLegacyStorage } from '#lib/tools/preferences.ts';
	import { locale } from 'svelte-i18n';
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

	onMount(() => {
		polyfillCountryFlagEmojis();
		migrateLegacyStorage(data.locale);
	});
</script>

<svelte:head>
	<meta property="og:site_name" content="Chat Vault" />
	<meta property="og:locale" content={data.locale.replace('-', '_')} />
	<meta name="theme-color" content="#74c7ec" />
	<link rel="sitemap" type="application/xml" href="/sitemap.xml" />
</svelte:head>

<Navbar />
<main>
	{@render children()}
</main>
