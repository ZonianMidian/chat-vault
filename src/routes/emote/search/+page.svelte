<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Construction from '$lib/components/Construction.svelte';
</script>

<svelte:head>
	<title>{`Chat Vault | ${$_('navbar.emotes')}`}</title>
	<meta property="og:title" content={`Chat Vault | ${$_('navbar.emotes')}`} />

	<meta property="og:url" content="{page.url.origin}/emote/search" />
	<link rel="canonical" href="{page.url.origin}/emote/search" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<Construction />
