<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import SelectOption from '$lib/components/SelectOption.svelte';
</script>

<svelte:head>
	<title>{`Chat Vault | ${$_('navbar.emotes')}`}</title>
	<meta property="og:title" content={`Chat Vault | ${$_('navbar.emotes')}`} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="flex min-h-[70vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	<SelectOption type="emote" />
</div>
