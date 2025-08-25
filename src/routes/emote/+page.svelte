<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import SelectOption from '$lib/components/SelectOption.svelte';
</script>

<svelte:head>
	<title>{`${$_('navbar.emotes')} | Chat Vault`}</title>
	<meta property="og:title" content={$_('navbar.emotes')} />

	<meta property="og:url" content="{page.url.origin}/emote" />
	<link rel="canonical" href="{page.url.origin}/emote" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="container-general container-h">
	<SelectOption type="emote" />
</div>
