<script lang="ts">
	import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
	import { navigating } from '$app/state';
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
	{#if navigating.to}
		<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
			<span class="loading loading-dots loading-xl"></span>
		</div>
	{:else}
		{@render children()}
	{/if}
</main>
