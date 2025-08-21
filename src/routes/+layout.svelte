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
	<meta property="og:site_name" content="Chat Vault" />
	<meta property="og:type" content="website" />
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
