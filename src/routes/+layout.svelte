<script lang="ts">
	import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
	import '@fontsource-variable/inter';
	import '../app.css';

	import Navbar from '$lib/components/NavBar.svelte';

	let { children } = $props();
	polyfillCountryFlagEmojis();
</script>

<svelte:head>
	<meta property="og_site_name" content="Chat Vault" />
	<meta property="og:type" content="website" />
</svelte:head>

<Navbar />
<main>
	{@render children()}
</main>
